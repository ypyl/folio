## 1. Ranking logic in the search core

- [x] 1.1 In `src/search/core.ts`, add an internal four-level tier to each accumulated result: 0 exact title (every term a literal case-insensitive substring of `title`), 1 exact body (every term literal in `text`, not all in title), 2 fuzzy title (Fuse reported a `title` match for a term), 3 fuzzy body. Compute the exactness flags inside the existing per-term loop using `exactRanges`, with no second scan of title or text; verify `npm run build` succeeds.
- [x] 1.2 Change the final sort in `searchDocs` to order by tier ascending, then score ascending, then `path`; keep the tier off the public `SearchResult`; verify `npx vitest run src/search/core.test.ts` passes.
- [x] 1.3 Add unit tests in `src/search/core.test.ts` covering each spec scenario: exact-title leads, exact-body over fuzzy-title, exact over fuzzy, fuzzy-title over fuzzy-body, ordering applied within a kind group, and ties keeping relevance then path order; verify all new tests pass.

## 2. Verification

- [x] 2.1 Run `npx vitest run` and confirm the full suite passes with no regressions in the search or spotlight/view tests.
- [x] 2.2 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent`, and confirm no lint or format issues remain.
- [x] 2.3 Bump `version` in `package.json` (minor, a user-facing ordering change) and confirm the status badge names the new build.
