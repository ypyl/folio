# Tasks

## 1. Search core: a case flag through matching and highlighting

- [x] 1.1 Add `fuseOptions(caseSensitive)` beside `FUSE_OPTIONS` in
  `src/search/core.ts`, returning the same config plus `isCaseSensitive`, and
  verify with a unit test in `src/search/core.test.ts` that a case-sensitive
  index finds `Docker` for `Docker` and not for `docker`
- [x] 1.2 Give `exactRanges` and `wordRanges` a trailing `caseSensitive = false`
  parameter that skips the fold, and verify unit tests cover both modes
  (existing ranges unchanged, `docker` no longer matching `Docker` when on)
- [x] 1.3 Thread the flag through `searchDocs` and its private helpers
  (`hasExact`, `hasWord`, `wholeWordHits`) so literal matching, whole-word
  matching for short terms, and the ranking tiers all compare one mode, and
  verify unit tests cover a mixed-case corpus: default search finds both
  spellings, case-sensitive search finds one, tiers still hold
- [x] 1.4 Verify the snippet ranges a case-sensitive run reports cover exactly
  the matching-case occurrences, including a page holding both spellings, with a
  unit test over `searchDocs` + `snippetSegments`

## 2. Spotlight: the match-case toggle

- [x] 2.1 Wrap the input and the clear `×` in a positioned `.field` inside
  `.box` and add the `Aa` toggle button with `aria-pressed` and
  `aria-label="Match case"`, the pressed state in `--brand` ink and hover on
  `--warm-sand`, and verify the spotlight renders the control unpressed on open
- [x] 2.2 Hold `caseSensitive` in the spotlight, memoize the Fuse on
  `[docs, caseSensitive]`, pass the flag to `searchDocs`, and verify a press
  re-runs the current query (mixed-case corpus: one result with the toggle off,
  the exact-case one with it on) and keeps the input's text and focus
- [x] 2.3 Keep the toggle with the query across a close and reset it to off on
  clear (the `×` and Escape), and verify both behaviors in the spotlight tests
- [x] 2.4 Record the rule in `DESIGN.md` beside the search field's styling and
  verify the doc names the control's tokens, its accessible name, and its reset
  behavior

## 3. Integration checks

- [x] 3.1 Run the full suite (`npm test`), `tsc -b`, `npx oxlint
  --deny-warnings`, `npm run build`, and the e2e suite, and fix anything they
  catch
- [x] 3.2 Confirm in the built app that pressing the toggle narrows a mixed-case
  query, that the results view lists the same narrowed set, and that reopening
  the spotlight keeps the pressed state

## Workflow follow-up

- Sync the delta spec into `openspec/specs/search/spec.md` and archive the
  change.
- Commit the feature with a minor version bump, then the archive with a patch
  bump, and push both to `origin` and `nas`.
