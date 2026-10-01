# Proposal

## Why

A page can reference many large vault images — screenshots are the common case. The editor resolves every vault image on render, all at once, and pins each file for the page's lifetime, so an image-heavy page holds encoded bytes and full-resolution decoded bitmaps for every image whether or not it is on screen. On a machine with less memory the page becomes unresponsive (Chromium's "Page Unresponsive / Wait or Exit"), typically while another screenshot is inserted. The `page-editing` requirement "Vault image references render in the editor" mandates exactly that eager, read-once-on-render behavior, so bounding it is a spec-level change, not an implementation tweak.

## What Changes

- A vault image is resolved when it is needed for display, not all at once when the page renders, so the number of live images the page holds does not grow with the number of images the markdown references.
- An image that leaves the viewport far enough releases its bytes and is resolved again if it returns. The "read at most once per open page" guarantee becomes a bounded, viewport-scoped lifecycle.
- The image element carries `decoding="async"`, and lazy loading semantics apply to vault images.
- Concurrent vault reads are capped, so opening an image-heavy page does not fire one parallel binary read per image at once.
- The `:has(> img[src^='blob:'])` stylesheet gate is replaced by a data attribute the resolution pass sets, so writing a resolved `src` no longer forces `:has()` re-evaluation across every image wrapper.
- The page's markdown is untouched: the document keeps the vault path, the file on disk is unchanged, and reload-stability holds (ADR-0001, ADR-0009).

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `page-editing`: "Vault image references render in the editor" changes from eager resolution with a read-once-per-open-page guarantee to a bounded, viewport-scoped resolution lifecycle, and the rendered image element gains async decoding. An image-heavy page stays responsive to open and type in.

## Impact

- `src/editor/assetImages.ts`: the resolution lifecycle — the viewport window, release and re-resolution, and the read cap.
- `src/editor/vaultImageView.ts`: the image element's `decoding` attribute and the resolved-state attribute.
- `src/components/EditorPane.tsx`: the visibility root the pass is driven by (the pane scroll container).
- `src/components/EditorPane.module.css`: the control's reveal gate moves off `:has()`.
- `openspec/specs/page-editing/spec.md`: the delta above.
- New ADR: image resolution is viewport-scoped, amending the `render-vault-images` reasoning and referencing ADR-0018.
- Unchanged: `VaultStorage`, the vault index, the asset model (ADR-0022), asset opening (ADR-0021), the markdown on disk, and the save path.

**Keystroke budget** (AGENTS.md): the change moves work off the render/open path. The typing path already carries nothing per keystroke; it carries one image scan per 200 ms debounced change, which this change keeps or shrinks (off-screen images cost no read and one skip). The budget requirement is met by the design's measurement, taken on a synthetic image-heavy vault with the harness the `bound-editor-per-keystroke-work` change recorded.

## Non-goals

- No image resizing, alignment, caption, or figure support, and no width or size written into the markdown.
- No on-disk thumbnails or derived image cache: that adds a second store and a second invalidation rule for little gain over bounding the live set.
- No change to remote or `data:` image rendering: they keep natural size, no control, and the vault is never read for them.
- No change to the fit/expand behavior of a displayed image (the `fit-vault-images-to-pane` requirement is untouched).
- No change to the save path: rebuilding the search corpus or `Fuse` on every save, moving `fold`/parsing off the post-save tick, and the overlapping `flush()` bug are separate work, not covered here.
- No new dependency, no backend, no database.
