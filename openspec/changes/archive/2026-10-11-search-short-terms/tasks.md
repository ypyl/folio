# Tasks

## 1. Core matching

- [x] 1.1 `termsOf` keeps every non-empty term; drop the three-character filter
  and update its doc comment
- [x] 1.2 Add `wordRanges` and `hasWord` whole-word helpers (letters and digits
  are word characters; punctuation is a boundary)
- [x] 1.3 `searchDocs`: short terms come from a scan of `fuse.getIndex().docs`
  filtered by `hasWord`, use `wordRanges` for ranges, and count as literal with
  no fuzzy fallback; long terms are unchanged
- [x] 1.4 `SearchSpotlight.run`: hold the dropdown shut when a query shorter
  than three characters matches nothing

## 2. Tests

- [x] 2.1 `core.test.ts`: `termsOf` keeps one and two character terms
- [x] 2.2 `core.test.ts`: a short query finds a page titled `UX` and a page whose
  body holds the word `UX`
- [x] 2.3 `core.test.ts`: a short term does not match inside a longer word
  (`UX` does not surface `Linux`)
- [x] 2.4 `core.test.ts`: `UX design` requires both terms, dropping pages that
  hold only one
- [x] 2.5 `core.test.ts`: three-character and longer behavior is unchanged, fuzzy
  typo match still works
- [x] 2.6 `SearchSpotlight.test.tsx`: a two-character query deploys the dropdown
  and renders its match, and a two-character query with no match deploys nothing

## 3. Verification

- [x] 3.1 `npx oxlint --fix`, `npm run fmt`, then `npx oxlint --deny-warnings`
- [x] 3.2 `npm test` (all projects) and `npx tsc -b` pass
- [x] 3.3 Confirm the spotlight deploys and lists the `UX` page for the `UX`
  query in a real browser against a vault holding a `UX.md` page
