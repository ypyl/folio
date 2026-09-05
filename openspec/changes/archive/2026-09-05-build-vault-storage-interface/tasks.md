## 1. Interface module

- [x] 1.1 Create `src/vault/storage.ts` exporting the `VaultStorage` interface: `read(path: string): Promise<string>`, `write(path: string, content: string): Promise<void>`, `delete(path: string): Promise<void>`, `list(path: string): Promise<string[]>`. Add a JSDoc comment stating the path contract (root-relative, `/`-separated, no leading `/`, no `..`, no absolute; `''` = root). Verify: `npm run build` passes
- [x] 1.2 Confirm the file is types-only (no runtime statements). Verify: `npm run test` passes with coverage thresholds intact — if istanbul counts the untouched types-only file as uncovered, add a one-line `exclude` entry in `vitest.config.ts` and note it in the change summary (design risk D1-mitigation). Verify: `npm run test` still green

## 2. Contract & documentation

- [x] 2.1 Write `adr/0013-vault-storage-path-and-io-contract.md` (MADR format, status Accepted): Context (ADR-0003 sketch leaves `Entry` undefined; ADR-0004 keys index by `path`; future wikilink-derived filenames — ADR-0012), Decision (flat recursive `Promise<string[]>` list; root-relative `/`-separated paths, no `..`/absolute/leading `/`, `''` = root; write creates missing parents; missing files reject, errors propagate; text-only ops with binary added additively later), Consequences (index keys are implementation-stable; `..` is a trust boundary; no error-type module until a consumer branches). Verify: `npm run lint`/`openspec validate` unaffected, ADR reads coherently; add the row to `adr/README.md`'s Decided table
- [x] 2.2 Add a one-line pointer in `adr/0003-vault-storage-abstraction.md` to ADR-0013 (and the vault-storage spec); the sketch stays unchanged. Verify: ADR-0003 still reads coherently, pointer resolves

## 3. Acceptance gates

- [x] 3.1 Grep gate: nothing imports from `src/vault` yet (no consumers in this change). Verify: `grep -rn "vault" src --include="*.tsx" --include="*.ts"` shows no component/App import of `src/vault`
- [x] 3.2 `npm run lint` and `npm run build` pass; `openspec validate` passes on the change