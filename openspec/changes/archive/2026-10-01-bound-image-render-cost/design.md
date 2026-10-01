# Design

## Context

See `proposal.md` — Why. Current state that shapes the approach:

- `src/editor/assetImages.ts` holds a per-pane cache (`urls`, `attempted`) and one `syncAssetImages(host, cache, read)` pass. `EditorPane` drives it from the adapter's change listener (Milkdown debounces that by 200 ms) and from the seed. The pass reads every unresolved vault image in the host, all at once, and `URL.createObjectURL` pins each file's bytes until the pane unmounts (`releaseAssetImages`).
- `src/editor/vaultImageView.ts` creates a bare `<img>`; ProseMirror treats a leaf node view as a mutation-ignored subtree (`contentDOM` is null), so the pane's pass is free to rewrite `src` without the document seeing it.
- The `:has(> img[src^='blob:'])` gate in `EditorPane.module.css` is what reveals the expand control; each `src` write re-evaluates it across every image wrapper.
- `bound-editor-per-keystroke-work` established the measurement recipe this change reuses: a folder backed by the Origin Private File System with `window.showDirectoryPicker` overridden, seeded pages, and `playwright-cli` driving the burst.
- `src/editor/assetImages.test.ts` and the `page-editing` scenarios currently assert read-once-per-open-page; the spec delta changes that contract.

## Goals / Non-Goals

**Goals:**

- The bytes an open page holds for images do not grow with the number of images the markdown references; only images needed for display are live.
- Opening an image-heavy page issues a bounded number of vault reads in flight, not one per image.
- The keystroke path gains nothing; the render/open path loses work.
- Measurement, taken and recorded before and after, per the AGENTS.md budget.

**Non-Goals:**

- No document virtualization, and no change to the image node view's ownership or to the fit/expand behavior.
- No on-disk thumbnail cache, no second store, no cross-page cache.
- No change to `VaultStorage`, the index, the asset model, or the save path.

## Decisions

### D1 Resolution is driven by display need, not by page render

An `IntersectionObserver` rooted at the pane's scroll container decides which images are needed. An image is resolved when it enters the root with a margin, and the pass no longer reads anything itself; it only registers images with the observer and reconciles already-resolved ones.

Rejected: resolving everything eagerly and deferring only the `src` write. The file read and the object URL would still pin every image's encoded bytes for the page's life, which is half the memory and all of the parallel-read burst.

Rejected: `loading="lazy"` alone. It defers the browser's load but not our `readBinary` + `createObjectURL`, so the bytes are still pinned.

### D2 An image that leaves the margin releases its bytes and is re-resolved on return

Leaving the margin revokes that image's object URL and drops it from the cache, so both the encoded bytes and the decoded bitmap are released. Returning re-reads the file. This replaces "at most once per open page" with "at most one live resolution per visible image", which is the spec delta.

Because the cache is keyed by path and several elements can share one path, the cache tracks a per-path count of elements currently in view; the URL is released when that count reaches zero.

Rejected: keeping the URL and clearing only `src`. Removing `src` drops the display but Chromium may keep decoded data for the URL in its image cache; revoking the URL is the reliable release.

### D3 Vault reads are capped

A small in-flight cap (a queue; the exact number is tuned by the measurement, and 2–4 is the expected range) bounds concurrent `readBinary` calls, so a slow or synced disk is not hit by one read per image at once. This is the mechanism behind "opening is not one blocking burst".

Rejected: leaving the burst unbounded, as today. It is the sharpest difference between a fast and a slow machine.

### D4 The resolved-state gate is a data attribute, not `:has()`

The pass sets a `data-resolved` attribute on the wrapper when an image's bytes are live, and the stylesheet gates the control on that attribute. Writing `src` no longer re-evaluates a `:has()` across every image wrapper.

Rejected: keeping `:has()` and relying on Chromium's invalidation optimizations; the attribute costs one write and removes the question.

### D5 A path that cannot be resolved is still not retried

The failed-path rule is kept but separated from the live cache: a path the vault cannot read enters a `failed` set for the page's life and is never enqueued again, so a missing file does not re-read on every scroll in and out of view.

### D6 Failed and in-flight bookkeeping

On success the URL is stored per path and written to every element registered for that path. On failure the path is marked failed and the element keeps its markdown path, as it does now.

### D7 The image element requests asynchronous decoding

`vaultImageView` sets `decoding="async"` on the element it creates, so decoding does not block the editing surface. This is the mechanism behind the last scenario of "An image-heavy page stays responsive".

## Risks / Trade-offs

- [Chromium retains decoded data for a revoked blob URL] → revoke, don't just clear `src`; the measurement's memory instrument confirms release.
- [Fast scrolling flickers as images leave and return] → the root margin is at least one viewport, so an image is only released once it is well out of sight; the exact margin is tuned by the measurement.
- [Releases and re-resolves make read counts in existing tests wrong] → the tests move to the new contract (a spy asserts what is live, not a one-shot count), and the spec delta records it.
- [jsdom has no `IntersectionObserver`] → the cache is built so the observer is injected or feature-detected; the pure decisions (when to read, when to release, the in-flight cap) are unit-testable without a browser, and one browser check exercises the real observer.
- [An image taller than the viewport never leaves the margin] → it stays live, which is correct: it is always needed for display.
- [The `readBinary` burst is reduced but a single very large image still costs its own decode] → accepted; bounding the count is what the requirement asks, not shrinking one image.

## Measurements

Taken with the `bound-editor-per-keystroke-work` recipe, ad hoc: a Chromium page with `window.showDirectoryPicker` overridden to return an OPFS directory seeded in-page — 20 canvas-drawn 800×600 PNGs under `assets/`, and one page referencing all 20 — driven with `playwright-cli` against `npm run dev:test`.

| instrument | before (eager pass) | after (this change) |
|---|---|---|
| live vault images, page open at top | 20 | 3 |
| live vault images, scrolled to the bottom | 20 | 5 |
| vault reads issued at once | 20 parallel | ≤ 3 (the cap) |

The "before" column is the old pass read from the code, not re-measured: `syncAssetImages` read every unresolved `<img>` in the host in one loop with no visibility check. The "after" column is a real browser run; the same run showed the page accepting typed input with no console errors while images resolved.

**Not measured: bytes.** `measureUserAgentSpecificMemory()` needs cross-origin isolation and `performance.memory` needs a launch flag, neither available here, so the recorded baseline is the live-image count, not a memory figure. The byte claim follows from the count — at most a few images' encoded bytes and bitmaps are live rather than all of them — but is not separately verified. Taking the memory number on a real screenshot-heavy vault is the follow-up.

**Structural guards (the durable part).** `assetImages.test.ts` drives an injected observer and asserts: no read before an image enters view; release and re-read on leave and return; a shared path stays live until its last viewer leaves; no more than `maxConcurrent` reads in flight; no URL for a read that finishes after the image left; a failed path is never retried. `EditorPane.test.tsx` drives a controllable `IntersectionObserver` through the real pane and asserts nothing is read at mount and the bytes are released on exit.

## Migration Plan

None. No persisted state, no data-shape change, no index change. Rollback is reverting the commit.
