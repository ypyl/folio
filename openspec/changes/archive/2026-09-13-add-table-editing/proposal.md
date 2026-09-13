## Why

The editor loads Milkdown's `commonmark` preset, which has no table node, so a page containing a pipe table opens as literal pipe text broken by hard breaks. The `page-editing` spec already claims tables are editable, so the app is behind its own contract, and any vault written by hand or by another tool shows its tables as raw pipes — the most visible place where the file and the app disagree.

## What Changes

- A GFM pipe table in a page renders as a real table: a header row, body rows, and cells edited in place. References inside a cell still render as badges and still open their page.
- Tables are created and extended: the `|4x3| ` typing gesture, an insert chord, pasting a Markdown table, add and delete row and column, column alignment, `Tab`/`Shift-Tab` between cells, `Enter` to leave.
- Structural edits get chords, so a keyboard user can extend a table without the pointer-only controls: add row below, add column right.
- Saving writes a table for a table. Table formatting adopts the app's canonical form (cells padded, a short delimiter row), and the parts the preset cannot express are written as they must be: an empty cell as `<br />`, and a header-only table with one empty body row.
- Only tables come in. Bare URLs, strikethrough, task lists, and footnotes keep exactly today's behavior: no autolink marks, no GFM footnote nodes, and `~~text~~` stays the presentational decoration it is today.
- A page ending in a table keeps a continuation paragraph, as a page ending in a code block does today.
- The keyboard-shortcuts reference gains the table rows.
- New ADR-0017 records the decision (the GFM table slice plus the component table block, in place of the whole GFM preset).

## Capabilities

### New Capabilities

- None. Tables are already named as editable in `page-editing`; this change makes that true and states its contract.

### Modified Capabilities

- `page-editing`: a new requirement makes a GFM pipe table a table in the editor — how it renders, how it is edited, what the saved Markdown is, and which cell content is not expressible. The existing "The open page is edited in place" and "The space below the last block belongs to the page" requirements are extended so a trailing table keeps a continuation paragraph.
- `ui-shell`: the keyboard-shortcuts reference must also cover table editing, including the chords Folio binds for structural edits and the two chords whose meaning depends on the caret being inside a table.

## Impact

- `src/editor/tableSetup.ts` (new) — the table slice: GFM's table schema, input rule, keymap, plugins, and commands registered by name, plus the table-only remark plugin and Folio's structural chords.
- `src/editor/milkdown.ts` — register the slice and the component table block, theme its controls, yield pastes and chords to it as the code block already does.
- `src/editor/documentTail.ts` — a trailing `table` gets the continuation paragraph a trailing `code_block` gets.
- `src/components/EditorPane.module.css` — the table block's chrome (handles, add and alignment buttons) styled from DESIGN.md's Tables rules.
- `src/components/shortcuts.ts` — the new rows, which are also their dispatch entries.
- Dependencies: `@milkdown/preset-gfm` and `@milkdown/components/table-block` (both already in the tree as transitive dependencies of `@milkdown/components`), `micromark-extension-gfm-table` and `mdast-util-gfm-table` (both already present via `remark-gfm`) declared directly.
- ADR-0017 records why the table slice and the component are adopted, and why the whole GFM preset is not.

## Non-goals

- **No whole GFM preset.** Autolink literals stay off: `https://…` and `www.…` keep the characters the user typed and no link mark is created (the existing `page-editing` requirement stands). Task lists, GFM footnotes, and the strikethrough mark stay out, so `~~text~~` keeps rendering through the decoration `render-struck-text` shipped.
- **No new on-disk syntax.** Cells merge, nested tables, column widths, colours, and any per-cell metadata are not Markdown and stay out (ADR-0009). A `<table>` written as raw HTML stays raw HTML.
- **No CSV, spreadsheet, or clipboard-HTML import.** A table arrives as Markdown: typed, pasted as text, or already in the file.
- **No block-based document model.** Tables are a ProseMirror node inside the one Markdown document, nothing more (ADR-0009).
- **No change to the index, search, backlinks, or the storage seam.** A reference inside a table cell is found by the existing line-based parser, and a table is one block to the gutter and to search anchors.
