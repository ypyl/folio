## 1. Implementation

- [x] 1.1 Create `src/vault/fs.ts` with the path parser and walker: split on `/`, reject empty/`.`/`..` segments, leading `/`, and absolute forms. Export a small `parsePath` for reuse. Verify: `npm run build` passes
- [x] 1.2 Implement `FileSystemVaultStorage implements VaultStorage`: `read` (walk + `getFileHandle`, reject on missing), `write` (walk creating parent dirs, `createWritable` + `write` + `close`), `delete` (`removeEntry(name, { recursive: true })` on the parent), `list` (recursive walk over `values()`, files only, root-relative, sorted). Verify: `npm run build` and `npm run lint` pass
- [x] 1.3 Add `pickVaultFolder(): Promise<FileSystemVaultStorage>` calling `showDirectoryPicker({ mode: 'readwrite' })`. Verify: `npm run build` passes

## 2. Tests

- [x] 2.1 Write `src/vault/fs.test.ts` with an in-memory fake `FileSystemDirectoryHandle` (Map-backed tree: `getFileHandle`, `getDirectoryHandle`, `values`, `removeEntry`, `createWritable`; `NotFoundError`/`TypeMismatchError` mimicking), cast `as unknown as FileSystemDirectoryHandle`. Verify: tests compile and run
- [x] 2.2 Cover every existing spec scenario plus the new ones: read existing → content; write creates parents + overwrites; delete file; delete directory recursively; list root (flat, files only, sorted); list subdirectory; invalid paths (`..`, `.`, leading `/`, empty segment, absolute) reject on all ops; `''` = root; read/delete missing reject; picker factory rejects on cancel. Verify: `npm run test` passes with coverage thresholds intact (all branches in `fs.ts` exercised)
- [x] 2.3 Grep gate: nothing outside `src/vault/` imports `fs.ts` — no consumers in this change. Verify: `grep -rn "from '../vault/fs'\|from './fs'" src --include="*.tsx" --include="*.ts"` shows only `fs.test.ts`; `npm run lint` and `npm run build` still pass; `openspec validate` passes