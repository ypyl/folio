## Context

See `proposal.md` for why. Facts that shape the approach:

- `VaultStorage` (`src/vault/storage.ts`) has `read` (text), `write`, `writeBinary`, `delete`, `list`, `stat` — no binary read. `FileSystemVaultStorage` (`src/vault/fs.ts`) resolves paths segment by segment and its `read` already walks to the parent and calls `getFileHandle`; `File.getFile()` resolves with a `File`, which is a `Blob`, so the bytes are one call away.
- Every test that needs a storage builds the real class over `FakeDirectoryHandle`, whose `getFile()` returns `new File([content], name, …)` and whose `writeContent` accepts `string | Blob` — so the fake already serves binary back and no test double needs a new method.
- `EditorPane` already owns a per-update DOM pass: `updateGutter()` reads `mountRef.current.querySelectorAll('.ProseMirror > *')` and is called from the adapter's change listener, from the seed's `setContent().then(...)`, and from a `ResizeObserver`. The toolbar-free editor keeps its DOM in the pane, and MilkdownAdapter owns the ProseMirror side.
- `EditorPane` receives `onDropFiles` from `App` (a closure over `activeFolder.storage`) rather than importing the vault, which keeps the pane free of vault imports (ADR-0010).
- jsdom implements `URL.createObjectURL` / `revokeObjectURL` (verified in this repo's test environment: a `blob:nodedata:…` string comes back), so the resolution path is testable without stubbing.
- Milkdown's image node renders an `<img>` from the node's `src` attribute, and the serializer reads the document, not the DOM — so the rendered element's URL is derived data.

## Goals / Non-Goals

**Goals:**

- One new storage operation, mirroring the text read's contract, and no change to any other storage behavior.
- Vault images display; the markdown is byte-for-byte unchanged; remote and `data:` images are untouched.
- Bounded work: at most one read per path per open page, no filesystem access on the keystroke path, and no vault-proportional work.

**Non-Goals:**

- No paste support (the next change), no image resizing, alignment, or any image UI.
- No rendering of non-image assets: a PDF or a text file stays a markdown link.
- No new editor dependency, no Milkdown node view, and no change to the editor seam (`EditorAdapter`).
- No caching of asset bytes or URLs beyond one open page, and no asset precaching in the service worker.
- No index change: `assets/` stays excluded from pages and backlinks.

## Decisions

### D1 The read is a path-scoped operation mirroring the text read

`readBinary(path: Promise<Blob>)` on the `VaultStorage` interface; in `FileSystemVaultStorage` it shares the path walk with `read` and returns `(await handle.getFile())`. Missing files reject (the `getFileHandle` error), matching the text read and the "missing files reject instead of returning null" requirement.

Rejected: overloading `read` to return a Blob for binary extensions. The interface stays a transport seam, not a format dispatcher, and callers would have to know which extensions are binary.

Rejected: a separate read path in the app composition layer (e.g. reaching the `FileSystemDirectoryHandle` from `App`). It would bypass the seam ADR-0003 draws and the fake-handle test double.

### D2 Resolution is a DOM pass in the pane, not a ProseMirror node view

A new module (`src/editor/assetImages.ts`) exports a cache and one function that walks the editor's images and swaps a vault-relative `src` for a `blob:` URL once its bytes arrive. `EditorPane` calls it where it already calls `updateGutter()` — the change listener and the seed — and passes in the vault read.

Rejected: a Milkdown node view for the image node. It would put asset resolution inside `MilkdownAdapter` (whose job is the editor, ADR-0010), need the resolver passed through the editor seam, and reach `@milkdown/prose/view` for the node-view factory — a package the app does not declare. The pane already owns this kind of derived-DOM pass.

Rejected: a `MutationObserver` on the editor DOM. The existing update hook already fires for every document change and for the seed, so a second, asynchronous source of truth for "the images changed" would add a race with no coverage gain.

### D3 One pass, two lookups, and a settled path is never read twice

The cache holds a `Map<path, blob-url>` for resolved paths and a `Set<path>` for paths already attempted (in flight or failed). The pass is: for each image, if the attribute is a vault-relative path, use the map or — when the path is neither resolved nor attempted — mark it attempted and start one read. That makes a pass over a document with images cost one query and one map lookup per image, with no read at all for anything already settled, so an unresolvable reference cannot retry on every keystroke (the reading cost would otherwise land on the typing path).

The pass is bounded by the open document's images, not by the vault: nothing lists `assets/` and no index is consulted.

### D4 Only scheme-less, non-absolute paths are candidates

A `src` that starts with a scheme (`/^[a-z][a-z0-9+.-]*:/i`) or a `/` is left alone; everything else is read from the vault as a vault-relative path. That covers the app's own `assets/…` references and a user's `img/…` next to a note, and it keeps remote, `data:`, and already-`blob:` URLs untouched.

### D5 Object URLs live as long as the page's editor

The cache is created per mounted pane and every URL it holds is revoked when the editor is torn down (the pane is keyed by page path, so a page switch remounts and releases). A read that lands after release creates no URL at all: the late result checks the released flag and drops the bytes. The pass only writes to an element still inside the host subtree it was handed, so a re-render that replaced the element mid-read cannot be written to. There is no cross-page cache: URLs are cheap to recreate and a cache would need invalidation when a file changes underneath.

### D6 The document text is never derived from the rendered element

Only the `<img>` element's `url` changes; the node's `src` attribute in the document is untouched, so the serializer keeps emitting `![photo](assets/photo.png)` and the autosave writes the same bytes it read. The gutter pass is the precedent: derived DOM, canonical file.

### D7 The pane keeps receiving the read as a prop

`App` passes `readAsset` (a closure over `activeFolder?.storage`, `undefined` without one), exactly as it passes `onDropFiles`. Without it the pass is a no-op, so the pane never imports the vault and the editor seam is unchanged.

## Risks / Trade-offs

- [The browser requests the vault path over the network before the pass rewrites the element] → The element is created by ProseMirror with the markdown path; the rewrite happens in the same turn as the render pass. A wasted origin request is possible and harmless (it 404s, as it does today); everything visible after it is the vault's bytes.
- [A large image is read whole into memory] → Bounded by what the user referenced, once per page, and revocable on unmount. Streamed or size-capped rendering is out of scope.
- [Two images referencing the same path share one URL] → The map is keyed by path, so sharing is deliberate: the second element gets the same URL and one revoke releases both.
- [An asset that changes on disk keeps displaying the old bytes until the page is reopened] → Accepted for this change (no cross-page cache, no invalidation). Reopening the page re-reads.

## Migration Plan

None. One interface member, one new module, no data-shape change and no persisted state.
