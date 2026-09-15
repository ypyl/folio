## Why

A dropped or pasted image renders at its natural pixel width, so a screenshot from a Retina display (often 2000px and up) runs past the right edge of the editor pane and the reader has to scroll sideways to see it. The pane is the reading surface; content should fit it. The reader also has the opposite need: when detail matters, the same image should be viewable at the size it was inserted in, without opening the file elsewhere.

## What Changes

- A vault image renders **fitted to the pane's content width**: an image wider than the pane is scaled down to it, an image narrower than the pane keeps its own size. Nothing is ever upscaled, and there is no minimum width — a narrow image is left alone.
- Each vault image carries a small control in its top-left corner that **expands it to its original size** and collapses it back to fit. Expanded, a wide image overflows the pane and the pane scrolls horizontally to it.
- The control is revealed when the pointer is over the image or it has keyboard focus, and stays visible while the image is expanded (the same reveal rule the table handles use).
- The control belongs only to a vault image that actually resolved: a remote (`https:`, `data:`) image and a vault path the vault could not read keep today's rendering — natural size, no control.
- Display only. The markdown never gains a width or a size attribute; expanding is transient view state, discarded when the page is left or reloaded, and the file on disk is byte-for-byte unchanged (ADR-0001).
- The image node's DOM becomes Folio's: a Milkdown node view (`$view`) renders each image, so the control can live inside the editable surface while staying something ProseMirror does not try to read as document content. This is the specific thing `render-vault-images` rejected — for its own scope, resolution, which stays in the pane.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `page-editing`: a new requirement — "Vault images fit the pane and expand to their original size" — covering the width an image renders at, the expand/collapse control and its state, that remote images and unresolvable paths are untouched, and that none of it reaches the document's markdown.

## Impact

- `src/editor/vaultImageView.ts` (new): the image node view — the `<img>` plus the corner control, the toggle, and the explicit DOM contract ProseMirror needs from a node view it does not own.
- `src/editor/assetImages.ts`: export the `isVaultRelative` predicate the node view branches on. No change to resolution, caching, or read-once behavior.
- `src/editor/milkdown.ts`: register the node view over the commonmark image schema.
- `src/components/EditorPane.module.css`: the fit rules, the expanded state, and the control's styling (the table handle's recipe — an ivory chip revealed on pointer proximity).
- `DESIGN.md`: an **Images** entry under Components, since the change introduces a control and a rendering rule the design language has to name.
- New ADR: the image node's DOM is Folio's, with the alternative (an overlay of absolutely positioned controls outside ProseMirror) and its cost recorded.
- Tests: `src/editor/vaultImageView.test.ts` for the node view's DOM and toggle; the fit itself is CSS and gets a browser check against a real vault with a wide and a narrow image.
- Keystroke budget: the change adds nothing to the typing path. The fit is CSS, the node view's update is a no-op for an unchanged node, and the control is built once per image, not per keystroke.

## Non-goals

- No width or size written into the markdown, and no per-image persisted size: the expanded state is not saved, in the file or in `.folio/`.
- No drag-to-resize control over the image, and no alignment, caption, or figure support.
- No lightbox, click-to-zoom, or click on the image to open the file.
- No change to how remote and `data:` images render: they keep natural size and no control, and the vault is never read for them.
- No change to asset resolution: still one read per path per open page, still nothing on the keystroke path, still no URL for a read that lands after the page is gone.
- No new dependency: the node view uses the Milkdown and ProseMirror packages the app already builds against.
