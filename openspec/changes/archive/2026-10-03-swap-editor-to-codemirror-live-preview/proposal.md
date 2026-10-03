# Proposal

## Why

Folio carries two editor stacks: Milkdown (ProseMirror + a remark/mdast round-trip) for the page surface, and CodeMirror 6 for code blocks. The ProseMirror stack exists to keep a document model in sync with Markdown, but Markdown is already canonical (ADR-0001) and Folio deliberately has no document model (ADR-0009). The round-trip costs 126 KB gzip and 164 packages at startup, and it re-serializes the whole document through `mdast-util-to-markdown` plus two full-document passes on every debounced change (`src/editor/milkdown.ts:182`) — exactly the per-edit cost the typing budget in AGENTS.md forbids.

Rejected alternative: OverType (and the textarea-over-preview family generally). Those overlay a transparent textarea on a rendered preview, so caret geometry comes from metric-identical layers; an inline image changes the line box and desynchronises them. Inline images are impossible in that architecture, not merely unimplemented.

## What Changes

- The page surface becomes plain Markdown text in a CodeMirror 6 editor, with view-only decorations. The document shown is the file written (ADR-0001): no serializer, no document model.
- Images render inline: `![alt](path)` is replaced by the image while the caret is elsewhere in the document, and shows its source when the caret enters the reference. Vault-relative paths keep resolving through the existing viewport-scoped pass (`src/editor/assetImages.ts`), which walks `img` elements and is already editor-agnostic (ADR-0028 unchanged).
- Page and board references (`#word`, `#[[Page]]`, `#!word`, `#![[Board]]`) keep their source text, are styled as references, and stay clickable, including Ctrl+click. The reference scanner (`src/vault/parse.ts`) is reused unchanged.
- **BREAKING (internal)**: the WYSIWYG surface is gone. Markdown markers are visible; emphasis, headings, and lists are syntax-highlighted instead of rendered.
- **BREAKING**: table-as-table editing is removed. A GFM table is text in the editor.
- **BREAKING**: the code block's own CodeMirror component and language picker are removed; fenced blocks keep syntax highlighting through the document's own grammar.
- **BREAKING**: the keyboard-shortcuts reference lists only what the app still binds (undo, redo, the reference chord, and search). The formatting and table chords are gone because the Markdown source is typed rather than toggled, and the code block's own chords went with its surface.
- **BREAKING**: the block line-number gutter is dropped. It numbered top-level blocks, and the Markdown source shows the file's own lines, so a per-block start number would restate what the text already shows.
- Presenting is disabled for now: the page row's Present entry is off, because the reading view's rendering of the Markdown source is not yet at parity with the page itself. The view, its derivation, and their tests are kept behind the disabled entry.
- Dropped and pasted files, drag-to-insert references, drafts, auto-save, and the placeholder are unchanged, because they go through `EditorAdapter` (ADR-0010) rather than through the editor.
- Supersedes ADR-0008 (Milkdown as the Markdown editor component); the ADR-0010 seam and ADR-0001/0009 are what make the swap a bounded change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-editing`: the surface is a Markdown source surface with inline decorations rather than WYSIWYG; inline formatting renders at rest and reveals its symbols when the caret enters the span; copy/paste no longer need a private Markdown flavor or a markdown-likeness rule; references are styled source text; a GFM table renders at rest and is edited as source; the empty tail block and the thematic-break rendering are removed; code blocks keep highlighting without their own component.
- `presentations`: slides are derived from the document's block-start rule (`src/lineAnchors.ts`) rather than from the editor's parsed document, and entering a presentation is disabled for now.
- `ui-shell`: the keyboard-shortcuts reference lists only the chords the app binds, and its formatting, code block, and table coverage requirements are removed.

## Impact

- `src/editor/milkdown.ts` (33 KB) and `src/editor/milkdown.test.ts` (91 KB) are replaced by a CodeMirror adapter.
- New: `src/editor/codemirror.ts`, a live-preview decoration module, and a small theme. It renders images and tables in place, and chips references.
- Removed: `src/editor/tableSetup.ts`, `tableCellCaret.ts`, `tableDeleteControls.ts`, `tableHandleClamp.ts` (the document model's table; a table renders at rest instead), `vaultImageView.ts` (its DOM contract moves into the image widget), `codeBlockSetup.ts` as a component surface, and the ProseMirror couplings in `inlineDecorations.ts`, `referenceSuggest.ts`, `searchHighlight.ts`, `documentTail.ts`, `emptyLines.ts`, `codeFormat.ts`, `chord.ts`.
- Dependencies: `@milkdown/*` (9 packages) leaves; `@codemirror/lang-markdown`, `@codemirror/view`, `@codemirror/state`, `@codemirror/commands` become direct dependencies (already resolved transitively).
- Unchanged: `src/editor/editor.ts` (the seam), `src/vault/*`, `src/presentation/*`, `src/lineAnchors.ts`, `EditorPane.tsx`'s lifecycle, `fakeEditor.ts` and every app test that runs against it.
- Fullscreen/presentation reading view keeps its own renderer and is out of scope here.
