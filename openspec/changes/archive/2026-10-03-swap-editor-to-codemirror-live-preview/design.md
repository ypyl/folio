# Design

## D1. The document is the buffer

The editor's state is the page's Markdown text. `EditorAdapter.setContent` seeds it, `onChange` reports the changed text, and nothing serializes. This removes the round-trip layer (micromark, mdast-util-from-markdown, mdast-util-to-markdown, unified, `@milkdown/transformer`) that exists only to keep a document model and Markdown in sync, and it removes the per-edit whole-document `mdast-util-to-markdown` pass plus the two full-document post-passes in `milkdown.ts:182`.

Measured after the switch-over: the entry chunk is **372 KB raw / 130 KB gzip**, against 954 KB raw / 308 KB gzip while both editors were present and 1.1 MB raw / 336 KB gzip before this change began. Nine `@milkdown/*` packages, the remark/mdast chain, and `codemirror` left `package.json`, and the install is 115 packages smaller.

Measured during the evaluation, minified, gzip, React excluded: Milkdown's minimum (`core` + `commonmark` + `gfm`) is 126 KB across 164 packages; CodeMirror 6 with `basicSetup` and `lang-markdown` is 200 KB across 25 packages. The editor engine is not smaller — `@codemirror/view` is 480 KB raw on its own. The win is the deleted round-trip layer and the deleted application code, not the engine, and the code blocks already use CodeMirror, so that half of the dependency graph stays.

## D2. Decorations, not a second document model

All rendering is a `Decoration` set computed over `view.visibleRanges` from the Lezer syntax tree `@codemirror/lang-markdown` already produces. Two decorations are used:

- **Replace** for an image reference: `![alt](path)` is replaced by an `img` inside the pane's existing `.folio-image` wrapper. The replacement is skipped while the selection touches the reference's range, so the source is editable by putting the caret in it.
- **Replace** for an inline construct's markers: bold, italic, strikethrough, and inline code render their content with the markers removed, and show the markers again as soon as the selection touches the span. Each marker is a couple of characters, so hiding it never replaces a line break, which is what lets a view plugin (rather than a state field) do it. The hidden markers are atomic, so the caret steps over them.
- **Mark** for a reference: `#word`, `#[[Page]]`, `#!word`, `#![[Board]]` get the chip class. The text is not replaced, so the source form stays visible, editable, and caret-independent, which is what the existing badge requirement already asks for.

Block markers (headings, lists, blockquotes, fences, thematic breaks) are deliberately left visible: hiding them would replace line breaks for the fence and list cases, and the user's stated preference was to see the Markdown there.

Decorations are view-only, so nothing here can reach the file. Cost scales with the visible region, which is a smaller bound than the current per-block scan and the only bound the typing budget allows.

## D3. The image pass is reused unchanged

`syncAssetImages` walks `host.querySelectorAll('img')` and resolves any vault-relative `src`, observing each element with an `IntersectionObserver` rooted at the pane. It never mentioned ProseMirror. An image widget that renders `<img src="assets/photo.png">` inside `.folio-image` therefore gets reading, capping, viewport scoping, release, and the expand control with no change at all, and ADR-0028 stays true as written. The one thing that moves is `vaultImageView.ts`'s DOM contract, which becomes the widget's own markup.

## D4. References and links

`findReferenceRanges` (`src/vault/parse.ts`) already reads plain text, so it is reused as-is: the scan runs on a document change, not per keystroke, and a click looks up the range under the caret. Click handling is one `domEventHandlers` on the editor, which routes plain and Ctrl+click to the existing `onReferenceClick` / `onBoardLink` listeners, and plain-text links carrying a scheme to `openExternal`. Completion becomes `@codemirror/autocomplete` reading the existing `SuggestionSources`; the canonical forms are produced by `referenceToken` / `boardToken`, which the requirement already fixes (ADR-0012 unchanged).

## D5. What does not survive, and why that is the honest cost

- **Tables.** A table renders as a table while the caret is off it, and shows its source while the caret is on it, so a cell is edited as Markdown. `tableSetup.ts`, `tableCellCaret.ts`, `tableDeleteControls.ts`, and `tableHandleClamp.ts` (39 ProseMirror references) have no equivalent: handles, in-place cell editing, and the row/column controls are gone. Alignment is written in the delimiter row.

  A table replaces line breaks, which CodeMirror forbids a view plugin from doing, so its decorations come from a `StateField` and the widget is a block widget (`Decoration.replace({block: true})`, `WidgetType.block`). The field stays affordable by recomputing only the tables on the lines an edit touched (plus one line each way) and only the tables the caret moved on or off, and by returning its existing value when no table's reveal state flipped, so a keystroke that touches no table rebuilds nothing.
- **Code block component.** The embedded surface, its picker, and `codeBlockSetup.ts` go. Fenced content keeps highlighting because `@codemirror/lang-markdown` nests language grammars inside fences, with the same lazy `@codemirror/language-data` catalog the app ships today.
- **Block-shaped guarantees.** An empty tail block, the space below the last block, list-item Backspace behaviour, and empty-list-item round-tripping are document-model concepts with no equivalent. They are removed rather than re-expressed.
- **`staticBlocks`.** Presentations currently reuse the editor's parsed document so a deck uses the editor's grammar. The markdown source has one grammar too — the text itself — so slides derive from `blockStartLines` (`src/lineAnchors.ts`), the rule the gutter and search already share. The reading view keeps its own renderer, which is out of scope here.
- **`codeFormat.ts`** (the JSON reformat action) is ProseMirror-coupled and is dropped with the code block component.
## D6. The seam holds

`EditorAdapter` (`src/editor/editor.ts`) never mentions ProseMirror, and only `EditorPane.tsx` constructs a concrete adapter. The blast radius is `src/editor/`; `src/vault/`, `src/presentation/`, `src/lineAnchors.ts`, `App.tsx`, every other component, and every test that runs against `fakeEditor.ts` are untouched. `EditorPane.tsx` changes in one place: which adapter class it constructs, chosen by a local switch for side-by-side comparison.

## D7. Open questions

- Whether the reference chip should hide its `#[[ ]]` markers when the caret is away, or always show source. This change shows source (the user's stated preference) and can tighten later.
- Whether a link's destination should hide at rest, showing only its text (as a table cell already does). The mechanism is the same marker replacement, with one guard: a destination may span lines, where a view plugin may not replace.
- Whether heading markers (`##`) should hide at rest. Lists, blockquotes, and fences cannot follow, because hiding them replaces line breaks.
- Whether a table should offer a cell-level editing affordance (click a cell, edit only that cell) instead of showing the whole table's source. That needs an overlay or contenteditable cells, and is what the removed cell requirements would have covered.
- Whether a table with a broken delimiter row should fall back to source or keep its last render.

## D7b. Three features dropped by decision

- **Formatting and table chords.** The reference lists only what is bound: undo, redo, the reference chord, and search. A chord exists to toggle a rendering, and the surface has none to toggle; the code block's own chords went with its surface.
- **The line-number gutter.** It labelled each top-level block's start line. The source shows the file's lines, so the numbers restated the text.
- **Presenting.** Hidden behind one flag rather than deleted: the deck derives from the Markdown and is rendered by the reading view, whose rendering of that text is not yet at parity, so the entry would open a worse copy of the page. Kept whole so it can return.

## D8. ADR

Supersedes ADR-0008 (Milkdown as the Markdown editor component). ADR-0001, ADR-0009, and ADR-0010 are unchanged and are what make this bounded. Recorded as ADR-0029 when applied.
