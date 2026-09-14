## 1. Core index logic

- [x] 1.1 Change `isPagePath` in `src/vault/index.ts` to only accept paths starting with `pages/` or `journals/` (ending in `.md`, no hidden segments). Remove the `assets/` exclusion since it's no longer reachable. Verify: existing `isPagePath` unit tests updated and passing.
- [x] 1.2 Verify `kindOf` and `stem` still work correctly with `pages/` prefixed paths (no code change expected, just confirmation). Verify: `stem('pages/MyPage.md')` returns `MyPage`, `kindOf('pages/x.md')` returns `'page'`.

## 2. App-level path construction

- [x] 2.1 Update `handleOpenReference` in `src/App.tsx` to resolve unmaterialized pages to `pages/${target}.md` instead of `${target}.md`. Verify: clicking a forwardlink to a non-existent page opens `pages/name.md`.
- [x] 2.2 Update the forwardlink resolution in `src/App.tsx` (the `forwardlinkRows` memo) to use `pages/${l.target}.md` for unmaterialized targets. Verify: the MetaPanel forwardlinks row for a missing target shows `pages/name.md`.

## 3. Tests

- [x] 3.1 Update `src/vault/index.test.ts`: change all root-level page paths (`a.md`, `Welcome.md`, etc.) to use `pages/` prefix. Update `isPagePath` tests for the new prefix-based rules. Update `buildIndex` test fixtures. Verify: all index tests pass.
- [x] 3.2 Update any other test files that reference root-level page paths (e.g., `src/vault/suggest.test.ts`, `src/editor/referenceSuggest.test.ts`). Verify: all tests pass.

## 4. Lint and final check

- [x] 4.1 Run `npx oxlint --fix`, then `npm run fmt`. Verify: no lint or format errors.
- [x] 4.2 Run `npx oxlint --deny-warnings --format=agent`. Verify: clean output.
- [x] 4.3 Run full test suite (`npm test`). Verify: all tests pass.
- [x] 4.4 Bump version in `package.json`. Verify: version is incremented.
