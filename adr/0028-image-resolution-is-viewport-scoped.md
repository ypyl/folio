# ADR-0028: Vault image resolution is scoped to the pane's viewport

- Status: Accepted
- Date: 2026-10-01

## Context

`render-vault-images` resolved every vault image on the render pass and kept each file's bytes for the page's whole life, and recorded the cost as accepted: "A large image is read whole into memory → Bounded by what the user referenced, once per page, and revocable on unmount. Streamed or size-capped rendering is out of scope."

That bound is per *reference*, not per *screen*. A screenshot-heavy page therefore holds encoded bytes and full-resolution decoded bitmaps for every image its Markdown names, all resolved at once. On a machine with less memory the page becomes unresponsive — Chromium's "Page Unresponsive / Wait or Exit" — usually while another screenshot is inserted. `fit-vault-images-to-pane` kept resolution in the pane and only added presentation; it did not revisit the eager lifecycle.

## Decision

Scope resolution to what the pane needs to display, and release the rest.

- An `IntersectionObserver` rooted at the pane's scroll container decides which images are needed: an image is read when it enters the viewport with a margin of one viewport (design D1).
- When the last element showing a path leaves that margin, the object URL is revoked and the element's `src` is cleared, so both the encoded bytes and the decoded bitmap are released; re-entering re-reads the file (design D2). The element keeps the pixel size it had, as `width`/`height` attributes, so releasing does not reflow the document below it.
- Concurrent reads are capped, so a slow or synced disk is not hit by one read per image at once (design D3).
- A path the vault cannot read is remembered as failed and never retried for the page's life (design D5).
- The wrapper carries `data-resolved`; the stylesheet gates the expand control on it instead of `:has(> img[src^='blob:'])` (design D4), and the image element asks for asynchronous decoding (design D7).

Rejected: keep resolving everything eagerly and rely on `loading="lazy"` to defer the decode. It bounds rasterization but still creates one object URL per image and pins every file's bytes for the page's life, so the memory still grows with the number of references.

Rejected: `content-visibility: auto` on the image wrappers. It defers rendering but not our `readBinary` + `createObjectURL`, and it needs `contain-intrinsic-size`, which the app cannot supply without image dimensions it does not store.

Rejected: generating on-disk thumbnails or a derived image cache. It bounds decode but adds a second store inside the vault and a second invalidation rule, for a page's transient display need.

Rejected: leaving reads unbounded and only bounding the live set. The parallel `getFile()` burst is the sharpest difference between a fast and a slow machine, and the cap is three lines.

## Consequences

- The `page-editing` guarantee changes from "each vault path is read at most once per open page" to "at most one live resolution per visible image". "Read once per open page" as a *cost bound* is gone, and in exchange the bytes an open page holds do not grow with the number of images its Markdown references.
- A page whose images are all off screen holds none of their bytes. Scrolling through a long image-heavy page resolves and releases as it goes, so a fast scroll can start a read that is dropped when the image leaves before the bytes land; the cap keeps the waste bounded.
- Layout can shift as images resolve, exactly as it did when the whole page resolved at once. A released image keeps its box, so releasing never shifts.
- The pane, not the editor, owns the observer root, matching where the resolution pass already lived (ADR-0010). The image node view stays a view (ADR-0018): it sets `decoding` and knows nothing about the vault or visibility.
- Where `IntersectionObserver` does not exist — jsdom, a browser too old for it — every image is treated as visible, which is the eager behavior this ADR replaces. The lifecycle's decisions (when to read, when to release, the cap, the failed set) are unit-tested against an injected observer, and the pane wiring against a controllable one.
