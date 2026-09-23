## Why

Long nested lists are hard to read: a page that captures an outline forces the reader to scroll past detail that is not currently relevant. Logseq lets a writer fold a list item so its sub-items disappear from view. Folio has no such gesture, so an outline can only be read at full depth. This adds folding as a reading and editing affordance over the Markdown lists Folio already has.

## What Changes

- A list item that has children gets a disclosure control beside it. Activating the control folds the item, hiding its nested content in the editor; activating it again expands the item.
- Folding is **view-only**: it changes what the editor draws, never the page. The document, the serialized Markdown, and the file on disk keep every folded line (ADR-0001, ADR-0009).
- Fold state is **per session and per page**: it lives in the editor instance, is not saved anywhere, and resets when the page is closed, another page is opened, or the app reloads. Nothing is written to the vault — no `.folio/` file and no `collapsed::` property.
- The disclosure control sits **beside** the item's native marker rather than replacing it, so ADR-0020's decision to keep the browser's own marker stands (a new ADR records this and the view-only rule).
- A fold that changes the rendered layout without changing the document triggers the same re-measure the line-number gutter already does for a reflow, so gutter numbers stay glued to their blocks.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-editing`: adds a requirement that a list item with children can be folded and expanded, that a fold hides nested content without changing the page's Markdown, and that fold state is session-scoped and never persisted.

## Impact

- Editor layer only. A new ProseMirror plugin beside `inlineDecorations` (`src/editor/foldLists.ts`), registered in `src/editor/milkdown.ts`.
- The editor seam (`src/editor/editor.ts`, `src/editor/fakeEditor.ts`) gains a layout-change notification so a fold can ask the pane to re-measure the gutter — the same path a reflow already takes.
- `src/components/EditorPane.tsx` wires that notification to `updateGutter`; `src/components/EditorPane.module.css` styles the fold control and the hidden state.
- `DESIGN.md` gains a Lists entry for the disclosure control; a new ADR records that folding is view-only and keeps the native marker.
- No change to `VaultStorage`, the vault index, search, references, the Markdown serializer, or any saved bytes.
