# ADR-0029: The page surface is the Markdown text, edited in CodeMirror

- Status: Accepted
- Date: 2026-10-03

## Context

ADR-0008 chose Milkdown so Folio would not have to build a Markdown editor, and accepted a document model as the price of a WYSIWYG surface. ADR-0009 had already rejected a block-based document model as Folio's storage: Markdown is canonical, and app state has to be derivable from the `.md` files (ADR-0001).

In practice the two decisions pulled against each other. Milkdown keeps Markdown and ProseMirror in sync through a remark/mdast round trip: `micromark`, `mdast-util-from-markdown`, `mdast-util-to-markdown`, `unified`, and `@milkdown/transformer`, 164 packages in the entry graph. Every debounced change re-serialized the whole document through `mdast-util-to-markdown` plus two full-document post-passes, which is the per-edit cost the typing budget in AGENTS.md forbids. The app also grew a second surface for code blocks (ADR-0014) and a ProseMirror node view to own the image element (ADR-0018), so it shipped two editor stacks: ProseMirror for prose, CodeMirror for code.

The alternative considered and rejected: OverType and the textarea-over-preview family. Those render a preview beneath a transparent textarea and derive caret geometry from metric-identical layers, so an inline image changes the line box and desynchronizes them. Inline images are impossible in that architecture, not merely unimplemented.

## Decision

The page surface is the page's Markdown text in a CodeMirror 6 editor, with every rendering applied as a view-only decoration over that text. There is no serializer and no document model between the file and the screen: `EditorAdapter.setContent` seeds the buffer, a change reports the text, and nothing converts.

Rendering is a decoration set computed over the visible region, from the syntax tree `@codemirror/lang-markdown` already produces:

- An image reference is replaced by an `img` element inside the pane's existing `.folio-image` wrapper while the caret is outside it, and shows its source when the caret enters it. The pane's viewport-scoped image pass is unchanged (ADR-0028).
- A GFM table is replaced by a table while the caret is off it, and edited as its source on it. This comes from a state field with a block widget, because CodeMirror forbids a view plugin from replacing line breaks.
- Bold, italic, strikethrough, and inline code hide their markers at rest and reveal them when the selection touches the span.
- Reference tokens (`#word`, `#[[Page]]`, `#!word`, `#![[Board]]`) keep their source text and get the chip styling. The scanner in `src/vault/parse.ts` is reused unchanged.
- Fenced code is highlighted by the document's own grammar, from the same `@codemirror/language-data` catalog the code block component used, through one shared token mapping (`src/editor/codeHighlight.ts`).

Consequences that were decided rather than discovered: formatting and table chords are not bound and are no longer listed in the keyboard-shortcuts reference, because the source is typed rather than toggled; the block line-number gutter is dropped, because the source shows the file's own lines; and Presenting is disabled behind one flag, because the reading view's rendering of that Markdown is not yet at parity.

This supersedes ADR-0008, ADR-0014, ADR-0017, and ADR-0018. ADR-0001, ADR-0009, ADR-0010, and ADR-0028 are unchanged, and are what made the swap bounded: the pane, the draft stream, the drop and paste intake, the vault layer, and the search are all behind the `EditorAdapter` seam and did not change.

## Consequences

- The entry chunk is 372 KB raw / 130 KB gzip, against 954 KB raw / 308 KB gzip while both editors were present. Nine `@milkdown/*` packages, the remark/mdast chain, and two further direct dependencies are gone: 115 packages removed from the install.
- A keystroke changes only the line it touched: CodeMirror re-parses incrementally and the decorations are rebuilt for the visible region, with the table field scoped to the edited lines and the tables the caret moved on or off. Nothing re-serializes the document.
- Text the user did not touch is never rewritten. The old surface re-serialized the whole page on every debounced change, so it could reformat a table, normalize a list marker, or add escape characters to text the user never edited. It cannot now.
- Markdown markers are visible: headings show `##`, lists show `-`, and a link shows its destination. This is a deliberate change in kind, not a regression.
- The app no longer owns text-editing problems it never wanted: undo, redo, IME, multi-cursor, selection, clipboard, and line wrapping come from CodeMirror.
- Dependencies on the ProseMirror ecosystem are gone, so ADR-0016's chord replay now targets CodeMirror's keymap and the reference chord (`Mod+Enter`) is claimed by the adapter.
- Two costs are accepted. A table is edited as its Markdown rather than cell by cell: there are no handles, no cell navigation, and no alignment commands. And a fence is highlighted text rather than its own editing surface: no language picker, no per-block folding or search, and no JSON reformat.
- If a Chromium-first PWA later needs a WYSIWYG reading surface, it belongs in the reading view (as Presenting is), not in the editor.
