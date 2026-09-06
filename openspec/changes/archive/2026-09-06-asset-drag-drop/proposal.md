## Why

PLAN.md task 8: users drag files (images, PDFs, anything) onto the editor and the app must copy them into the vault and insert a markdown link at the cursor. Without it, Folio notes can only ever contain text — no way to attach a file to a page, which is table-stakes for a notes tool ("the folder is the database": the file must land inside the vault so the links survive outside the app).

## What Changes

- New `VaultStorage.writeBinary(path, blob)` method — text `write()` stays strict; binary assets get their own sibling (renders `assets/` as the binary home).
- Drop handling on the editor pane: `dragover`/`drop` are prevented at the pane level (dropping anywhere never navigates the app); when a page is open, dropped files are copied to `assets/` (unique name on collision) and one markdown link is inserted per successfully copied file at the cursor — `![name](assets/name.ext)` for images, `[name](assets/name.ext)` otherwise.
- The index scan excludes the `assets/` folder: content there is referenced, never navigated (a dropped `.md` under `assets/` must not become a page).
- Insertion reuses the parser: the raw markdown link is inserted as text at the caret, so the existing `markdownUpdated` listener feeds the draft/autosave machinery with no extra wiring (ADR-0008).

## Non-goals

- **No asset display.** `![..]` links will render as broken images in the editor until a future renderer resolves `assets/` paths — by design (see design.md, decision 2). No object-URL resolver, no click-to-view modal.
- **No recursive folder drops.** Directories in a drop are silently ignored; only `File` entries are copied (decision 3).
- **No base64/data-URL storage, no text-write for binaries** (decision 1).
- **No progress UI, no drag-over visual states** — the pane's drop handling is invisible until files land as links.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `vault-storage`: the storage interface gains a binary write path (`writeBinary`) for assets.
- `page-editing`: the editor pane copies dropped files into the vault and inserts their links at the cursor.
- `vault-index`: the `assets/` folder is outside the scan scope.

## Impact

- `src/vault/storage.ts` — `VaultStorage` interface + one method.
- `src/vault/fs.ts` — `FileSystemVaultStorage.writeBinary`.
- `src/vault/index.ts` — scan predicate excludes `assets/` (the incremental watcher inherits it).
- `src/components/EditorPane.tsx` — one `onDropFiles(files) => Promise<string[]>` prop; pane-level `dragover`/`drop` guards; link insertion through the adapter (`EditorAdapter` gains an insert-at-selection call).
- `src/editor/editor.ts` + `src/editor/milkdown.ts` — `insertMarkdown(text)` adapter method.
- Test fakes: `vault/fakeHandle` and the editor fake gain binary/insert parity.
- In scope of ADR-0013 (path contract; `assets/` convention joins it) and ADR-0010 (editor seam); no new ADR needed — noted in design.md.