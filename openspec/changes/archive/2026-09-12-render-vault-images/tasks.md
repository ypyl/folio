## 1. Binary read

- [x] 1.1 Add `readBinary(path): Promise<Blob>` to the `VaultStorage` interface in `src/vault/storage.ts`, documented as the binary counterpart of `read` under the same path contract and missing-file rule; verify `npx tsc -b` reports every implementation that needs the member.
- [x] 1.2 Implement it in `FileSystemVaultStorage` (`src/vault/fs.ts`) by sharing `read`'s path walk and returning the resolved file handle's `getFile()` (design D1); verify `npx vitest run src/vault/fs.test.ts` passes with cases for bytes round-tripping, a missing path rejecting, and an invalid path rejecting.

## 2. Resolution module

- [x] 2.1 Add `src/editor/assetImages.ts`: a per-page cache (`Map` of resolved path to object URL, `Set` of attempted paths, a released flag), `createAssetImages()`, `syncAssetImages(host, cache, read)`, and `releaseAssetImages(cache)` implementing design D3 to D4 — scheme-less non-absolute `src` only, one read per path, revoke on release, no URL for a read that lands after release; verify `npx vitest run src/editor/assetImages.test.ts` passes with cases for: a vault path resolving to the file's bytes, the markdown path being left in the attribute's own terms, a remote `https:` and a `data:` URL being skipped, a failing read leaving the element alone and never retrying across passes, the same path read once across repeated passes, and every created URL revoked on release.
- [x] 2.2 Verify the module touches React, the vault, and Milkdown nowhere — imports only from the DOM and its own types — so it stays a plain function over a DOM subtree.

## 3. Pane and app wiring

- [x] 3.1 In `src/components/EditorPane.tsx`, accept an optional `readAsset?: (path: string) => Promise<Blob>`, hold one cache ref per mounted editor, call `syncAssetImages` where `updateGutter()` is called for a document change and for the seed (not from the resize observer, which is about measurement), and release the cache in the mount effect's cleanup (design D5, D7); verify `npx vitest run src/components/EditorPane.test.tsx` passes with a case asserting that a vault image in the mounted document is resolved with the provided reader and that unmounting revokes the URL, and that the pane renders as before when the reader is absent.
- [x] 3.2 In `src/App.tsx`, pass `readAsset` from the active folder's storage, absent without one, in the same shape as `onDropFiles`; verify `npx vitest run src/App.test.tsx` passes, including a case where a vault image referenced by an open page displays its bytes.
- [x] 3.3 Confirm the markdown is untouched by resolution: in the pane test, read the editor's serialized markdown after the image resolves and verify it still holds the original vault path (design D6).

## 4. Gates

- [x] 4.1 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent`; verify all three are clean.
- [x] 4.2 Run `npm test` and `npm run build`; verify both pass.
- [x] 4.3 Browser smoke in Chrome against a real vault: open a vault with an image in `assets/` and a page referencing it, confirm the image renders, that a remote image still renders, and that typing in the page neither re-reads the file nor flickers the image. Note that opening a vault needs the native directory picker, so state plainly which part of this was verified by hand and which by test.
