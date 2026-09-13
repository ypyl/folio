## Context

See `proposal.md` — Why. The facts that shape the approach, all measured against the real editor pipeline (Milkdown's own parser/serializer in jsdom, and the keymap path the app's `applyChord` uses):

- The editor chain is `commonmark → listener → history → codeBlockComponent → inlineDecorations → referenceSuggest → documentTail` (`src/editor/milkdown.ts`). Commonmark has no `table` node: `| a | b |` parses to one paragraph of literal pipes.
- `@milkdown/preset-gfm` and `@milkdown/components` are already in the tree: ADR-0014 pulled them in as `@milkdown/components` dependencies. Their archetype for a component-backed block exists (`codeBlockComponent`), including the jsdom `IntersectionObserver` stub the tests need.
- Adding the whole `gfm` preset changes content nobody touched: `https://example.com` serializes as `<https://example.com>`, `www.example.com` as `[www.example.com](http://www.example.com)`, `~~x~~` becomes a `del` mark, `- [x]` a task item, `[^1]` a footnote. The first two break a live `page-editing` requirement and rewrite file bytes on the first edit.
- Slicing by filtering `gfm`'s exported arrays does **not** work. `$remark` and `$command` return array-like wrappers (`{0, 1, id, plugin, options}`) and `gfm` is a single flat array of their inner items, so `filter((p) => p !== remarkGFMPlugin)` leaves the remark plugin in place and GFM's autolink literals stay active. Registering the exported pieces by name does work.
- With the slice registered by name, everything except tables serializes byte-identically to commonmark alone: bare `http(s)://` and `www.` URLs, `~~runs~~`, `- [x]` markers, footnote syntax, lists, quotes, headings, links, inline code, tables-as-text.
- Canonical table forms measured: `| --- |` → `| - |`, cells padded to their column, an empty cell → `<br />`, a header-only table gains one empty body row, and a paragraph line beginning with `|` gains an escaped leading pipe (`\| just text |`). `<br />` comes from the commonmark preset's own empty-line preservation (`shouldPreserveEmptyLine` gates the paragraph serializer), not from the table slice.
- The component renders `div.milkdown-table-block` with `data-role="row-drag-handle"`, `col-drag-handle`, `x-line-drag-handle`, `y-line-drag-handle`, `button-group` alignment buttons, and `button.add-button`; every glyph is a `span.milkdown-icon` filled from `renderButton`'s HTML string (defaults `+`, `-`, `=`, `left`, `center`, `right`).
- The component calls these commands by key: `selectRowCommand`, `selectColCommand`, `moveRowCommand`, `moveColCommand`, `addRowBeforeCommand`, `addRowAfterCommand`, `addColBeforeCommand`, `addColAfterCommand`, `setAlignCommand`, `deleteSelectedCellsCommand`. All are exported individually by `@milkdown/preset-gfm`.
- Keymap behavior measured through a synthetic keydown on the ProseMirror root: `Tab` moves to the next cell, `Enter` leaves the table (the same binding covers `Mod-Enter`), `Mod-Alt-Enter` adds a row, `Mod-Alt-Shift-Enter` adds a column, `Mod-Alt-t` inserts a table.
- `Mod-Enter` with the caret inside a `#tag` in a cell opens the reference rather than leaving the table, in both plugin orders measured.
- The document tail (`documentTail`) fires only for `code_block`, so a page opened with a trailing table has no continuation paragraph, and the click-below gesture resolves into a cell.

## Goals / Non-Goals

**Goals:**

- Tables render, edit, and serialize as tables, and nothing else about a page's Markdown changes: no autolink marks, no task-list or footnote nodes, no strikethrough mark (so the `render-struck-text` decoration stays correct).
- A table stays a pipe table in the file, and a page that is only opened is never rewritten.
- The change is visible in the module it belongs to: the editor layer only, no storage, index, or search change.

**Non-Goals:**

- No ownership of the table serializer or of GFM's grammar: no hand-rolled Markdown writer, no per-feature parser flags.
- No cell merging, nested tables, or column widths: none of them exist in Markdown, and persisting them would mean per-cell metadata (ADR-0009).
- No HTML pastes: the app's paste path stays text-only, as it is today.

## Decisions

### D1 Register a table slice by name, not the `gfm` preset

`src/editor/tableSetup.ts` exports the plugin list Folio registers, built from named exports only: `tableSchema`, `tableHeaderRowSchema`, `tableRowSchema`, `tableHeaderSchema`, `tableCellSchema`, `insertTableInputRule`, `tableKeymap`, `keepTableAlignPlugin`, `autoInsertSpanPlugin`, `tableEditingPlugin`, the navigation commands (`goToNextTableCellCommand`, `goToPrevTableCellCommand`, `exitTable`), and the structural commands the component calls, plus Folio's own keymap for D5.

Rejected: `.use(gfm)`. It brings autolink literals, task lists, footnotes, and a strikethrough mark; worse, it rewrites bare URLs, which a live requirement forbids.

Rejected: registering `gfm` and filtering out the pieces Folio does not want. The arrays are flat and hold the wrappers' inner items, so identity filtering silently misses the remark plugin — the failure is invisible (URLs get rewritten) rather than a build error. A whitelist fails loudly, at build time, if an export is renamed.

Rejected: a Folio-written table schema and parser. That is the text-editing ownership ADR-0008 exists to avoid.

### D2 A table-only remark plugin replaces `remark-gfm`

`remarkTables` is a `$remark` plugin that registers `gfmTable()`, `gfmTableFromMarkdown()`, and `gfmTableToMarkdown()` from `micromark-extension-gfm-table` and `mdast-util-gfm-table` (both already present as `remark-gfm`'s own dependencies). This is the decision that keeps bare URLs literal while tables parse, serialize, and align, so it is the piece worth the small amount of own code. Rejected: `remarkGFMPlugin`, for the reason in D1.

### D3 No paste rule

`tablePasteRule` is not registered. The app's `handlePaste` claims every text paste and reads only `text/plain`, so ProseMirror's paste rules never run for it; a pasted Markdown table arrives through `insertParsedMarkdown` and the parser, which is the path that must produce the table. Registering the rule would add dead code. It becomes relevant only if a future change routes HTML pastes through ProseMirror, and that change can add it then.

### D4 The component table block supplies the table's chrome

`tableBlock` from `@milkdown/components/table-block` renders the handles, the row/column add and delete controls, and the alignment controls. Folio supplies `renderButton` markup (Folio-drawn icons with accessible names) and the CSS for the block's chrome, following DESIGN.md's Tables rules: no framed box, no tinted header bar, no vertical rules, hairline row rules, muted uppercase header labels. Registration mirrors the code-block precedent in ADR-0014, including the Vue cost already accepted there.

Rejected: the keymap and commands alone. Without the component the structural commands have no reachable control: the caret cannot add a row or column, and every table is frozen at the shape it arrived in.

Rejected: Folio-written table controls. That is the same re-ownership as D1's last alternative, for chrome that upstream maintains.

### D5 Folio binds the structural chords

The component's controls are pointer-only (`span` with `onPointerdown`, shown on hover), so the keyboard path is Folio's: a small `$useKeymap` registering `Mod-Alt-t` (insert table), `Mod-Alt-Enter` (add row below), and `Mod-Alt-Shift-Enter` (add column right) on the exported commands. `Tab`, `Shift-Tab`, and `Enter` come from `tableKeymap` and are documented, not rebound. The rows are listed in the shortcuts reference (`ui-shell` delta), which is also the dispatch table, so each row is a working control.

### D6 The tail rule covers a table

`documentTail` appends its paragraph when the last child is a `table` as well as a `code_block`, so the click-below gesture has a text position after the table. The paragraph stays out of the file through the existing `trimTrailingBlankLines` normalization.

### D7 Canonical table forms are accepted, and stated

Padding, `| - |` delimiters, `<br />` for an empty cell, one empty body row for a header-only table, and an escaped leading pipe on a paragraph line that starts with `|` are the representation of the same document, produced by a serializer Folio does not own. They are written into the spec as the contract rather than papered over, and the file is only rewritten when the user actually edits the page (the seed echo stays suppressed, as for any other construct). The line is drawn at *text*: nothing that only changes how text is interpreted is rewritten, which is exactly why D2 exists.

### D8 The reference chord wins inside a cell

With the caret in a `#tag` in a cell, `Mod-Enter` opens the page, not the exit. Measured in both plugin orders, so no ordering constraint is relied on — but the slice is registered after `inlineDecorations` in the chain, and the behavior gets a test, so a future reordering that changed it fails loudly.

### D9 Dependencies and an ADR

`@milkdown/preset-gfm`, `micromark-extension-gfm-table`, and `mdast-util-gfm-table` become direct dependencies (all already in the tree); `@milkdown/components/table-block` is a new subpath of an existing dependency. ADR-0017 records this decision the way ADR-0014 records the code block's.

## Risks / Trade-offs

- [An empty cell is written as `<br />`, so a table in the file gains HTML] → The representation is stable across reloads and disappears as soon as the cell has text; the spec states it. Suppressing it means overriding the serializer Folio does not own (D7).
- [A hand-written table is reformatted on its first save] → Same class of change as a code fence or list marker today, stated in the spec, and limited to pages the user edits.
- [`Enter` leaves the table, so a user cannot add a line inside a cell with it] → Upstream keymap, matching the component's own behavior; the add-row control and chord cover extending a table, `Shift-Enter` still breaks a line, and the reference lists the exit.
- [A paragraph line starting with `|` gains an escaped pipe] → Round-trip safety of the table syntax; the rendered text does not change.
- [Bundle weight: the table block pulls `dompurify`, `clsx`, and `lodash-es` (Vue is already there for the code block)] → Measure in the build task; if it is egregious, trim the `renderButton` markup and the registered command set, as ADR-0014's fallback trims `basicSetup`, rather than dropping the component.
- [One Vue node view per table on a page] → The same shape as one CodeMirror per code block: bounded by the table, not the document. The existing per-keystroke instrumentation covers the claim in the spec's last scenario.
- [The component resolves its commands by key, so a missing registration fails at click time] → Those exact command objects are in the registered slice (D1), and a jsdom smoke test drives each one.

## Migration Plan

None. No new file syntax, no persisted state, no storage or index change (ADR-0001). A vault written before this change renders identically except that its tables are tables; a table adopts the canonical form the next time its page is saved, and pages that are only read are not written at all. Rollback is removing the slice and the component: the files keep their tables, which then render as pipe text again, as they do today.

## Open Questions

- Whether the escaped leading pipe on a `|`-starting paragraph line is worth suppressing later. It is stable and text-preserving, so it can wait for a change that has another reason to touch the serializer.
