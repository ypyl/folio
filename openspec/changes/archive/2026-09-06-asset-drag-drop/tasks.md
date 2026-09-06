## 1. Storage seam: binary write

- [x] 1.1 Add `writeBinary(path: string, blob: Blob): Promise<void>` to `VaultStorage` in `src/vault/storage.ts` (same ADR-0013 contract as `write`; `'<root>'` and non-file paths still reject). Verify: `tsc -b` passes.
- [x] 1.2 Implement `writeBinary` on `FileSystemVaultStorage` in `src/vault/fs.ts` — resolve parent dirs with `create: true`, `getFileHandle(name, { create: true })`, pass the blob to `createWritable().write()`. Verify: `npm test` — new fs-level case writes exact bytes through the fake handle.
- [x] 1.3 Add binary-write parity to `src/vault/fakeHandle.ts` (`FakeFileHandle` stores a Blob alongside text; `FakeWritableStream.write` accepts Blob). Verify: storage tests gain a case asserting a Blob write round-trips.

## 2. Editor adapter: insert at cursor

- [x] 2.1 Add `insertMarkdown(markdown: string): void` to `EditorAdapter` in `src/editor/editor.ts`. Verify: `tsc -b` passes.
- [x] 2.2 Implement it in `MilkdownAdapter` (`src/editor/milkdown.ts`) via `editor.action` + `editorViewCtx`: `view.dispatch(view.state.tr.insertText(markdown))` at the current selection; no-op when the editor isn't mounted. Verify: mutation pushes `markdownUpdated` with the inserted text (listener-based test).
- [x] 2.3 Add `insertMarkdown` to the test fake editors (`src/editor/fakeEditor.ts`) recording calls. Verify: fake-based EditorPane tests can assert insertion args.

## 3. Index scan scope: assets excluded

- [x] 3.1 In `src/vault/index.ts`, reject from `scanScope` any path whose first segment is `assets/`. Verify: index scan case — an `assets/notes.md` never yields a page; existing suites stay green.
- [x] 3.2 Confirm the incremental watcher reuses the same predicate (no second scope site). Verify: grep shows a single scope function; an asset write triggers no page upsert.

## 4. Pane drop handling

- [x] 4.1 `EditorPane` gains `onDropFiles(files: File[]) => Promise<string[]>` prop and pane-level `dragover`/`drop` `preventDefault` handlers (both empty-state and page-open subtrees — the handler lives on `<main>`). Verify: jsdom drop event on the pane never calls `preventDefault`-less default and, with `page === null`, `onDropFiles` is never invoked.
- [x] 4.2 In the page-open subtree, `onDrop` extracts `dataTransfer.files` (plain entries only, directories ignored), awaits `onDropFiles`, and calls `adapter.insertMarkdown(link)` per returned path — image extensions (`png jpg jpeg gif webp svg bmp avif`) get `![name](path)`, others `[name](path)`. Link text derives from the path's basename. Verify: EditorPane tests assert `insertMarkdown` receives the right markdown per file type.
- [x] 4.3 Wire `onDropFiles` in `src/App.tsx` to the active folder's storage via the existing vault hook seam. Verify: App-level test — dropping a file with a fake storage lands an asset write and the link insertion flows through.

## 5. Copy flow: unique names, sequential copies

- [x] 5.1 Implement the copy loop (in App/vault wiring): snapshot `list('assets')` once per batch, resolve each name to the first free `name`, `name-1`, `name-2`, … (tracking names claimed in-batch), `writeBinary` each file sequentially, return the landed paths. Verify: unit tests — first drop keeps the name, second collides to `-1`, same-batch duplicates get distinct suffixes, a failed copy is omitted from returned paths.
- [x] 5.2 Error containment: one failed copy does not abort the batch. Verify: test with a failing storage write asserts the other files still land and only their links are inserted.

## 6. Gates

- [x] 6.1 Full gates: `npm test` (all files, coverage ≥80), `npm run lint`, `npm run build`, `openspec validate --changes`. Verify: all green, no new warnings.
- [x] 6.2 Dev smoke: `npm run dev` (fresh server), open the sample vault — drop an image onto an open page: file appears under `sample/assets/` with a unique name and `![..]` lands at the caret (broken image icon is expected — D2); drop two files at once: two links; drop a `.md` into `assets/` via the picker-explorer: it never appears in the sidebar; drop on the empty start screen: nothing happens, the app does not navigate. Verify: manual.