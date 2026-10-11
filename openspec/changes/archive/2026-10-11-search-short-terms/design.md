# Design

## Context

`src/search/core.ts` has two gates that stop a short query:

- `termsOf` drops every term under three characters ("terms under 3 characters
  are noise"), so a query of `UX` splits to `[]` and `searchDocs` returns `[]`.
- `FUSE_OPTIONS.minMatchCharLength: 3` makes Fuse itself ignore shorter matches.

Both exist to keep the strict `threshold: 0.25` honest. The comment on the
options says it plainly: a term must be a near-exact match, "a loose substring
alignment no longer counts". That is why `Linux` does not surface for a search
of a word inside it.

## Decision

Split behavior by term length.

- A term of three or more characters is unchanged: `exactRanges` for literal
  occurrences, Fuse for the fuzzy candidate set and typo fallback.
- A term shorter than three characters matches only as a whole word, compared
  case-insensitively. It does not go through Fuse at all.

Whole-word means the term is bounded on both sides by something that is not a
letter or a digit. Punctuation therefore counts as a boundary, which keeps `C#`
and `CI/CD` usable, and `Linux` fails the left boundary of `ux`.

## Implementation

All in `src/search/core.ts`.

1. `termsOf` keeps every non-empty term. It still trims and splits on whitespace;
   it no longer filters by length.

2. Two helpers for whole-word matching, built on `indexOf` plus a boundary check,
   not a per-item regex compile (the keystroke budget forbids allocating per
   visited item):

   ```ts
   const WORD_CHAR = /[\p{L}\p{N}]/u          // stateless: no /g, safe to share

   function wordRanges(text: string, term: string): SearchRange[]
   ```

   `wordRanges` walks `indexOf` occurrences of the lowercased term and keeps the
   ones whose neighbors are not word characters. A boolean `hasWord` shares the
   same boundary logic for the candidate filter. `hasWord(text, term)` is
   `wordRanges(text, term).length > 0`; the scan uses it per candidate.

3. `searchDocs` picks the candidate source per term:

   - Long term: `fuse.search(term)`, as today.
   - Short term: scan the docs Fuse already holds (`fuse.getIndex().docs`) and
     keep those where `hasWord(title, term) || hasWord(text, term)`. Fuse cannot
     supply these, because `minMatchCharLength: 3` filters them out.

   The accumulation changes only where short:

   - ranges come from `wordRanges`, never from Fuse's fuzzy indices;
   - the match counts as literal, so `_titleExact` / `_bodyExact` use `hasWord`
     and the tier is exact;
   - `_titleFuzzy` stays false and no fuzzy body fallback runs.

   Ranking, tiering, grouping, and the block/snippet pipeline are untouched: a
   short term is just another literal term.

4. `src/components/SearchSpotlight.tsx` decides deployment, not matching. When a
   run returns no results and the query is shorter than three characters, it
   holds `results` at `null` so no dropdown deploys. This keeps the empty state
   for real queries (the `xyzzy` case), avoids a "No matches" card while a short
   prefix is still being typed, and keeps the existing "short queries deploy
   nothing" rule true now that a short query can match.

```ts
const found = searchDocs(fuse, value)
setResults(found.length === 0 && value.trim().length < 3 ? null : found)
```

## Cost

A short term adds one pass over the in-memory corpus, the same order as the
`fuse.search` it replaces. It runs inside the existing 120 ms debounce, never on
the typing path, and allocates only the result ranges. No new index, no rebuild
on input change, no filesystem read (ADR-0001, ADR-0004).

## Alternatives considered

- **Lower `minMatchCharLength` to 1 or 2 and keep Fuse for short terms.**
  Rejected. Fuse's bitap matches substrings, so `UX` would surface `Linux`. That
  is exactly the loose alignment the strict threshold was added to remove.
- **Match a short term only against the title, exactly.** Rejected as too narrow:
  it finds `UX.md` but not a page that mentions the word `UX` in its body, which
  is the common case in a real vault.
- **A separate inverted index for short terms.** Rejected. It adds derived state
  to build and invalidate, against keep-it-small (ADR-0006), for a scan that is
  already the same order as the Fuse search beside it.

## Edge cases

- A one-character term matches whole words only, so `a` matches the word `a` and
  not every word containing it. It may return many rows; that is correct, and the
  per-group caps already bound the dropdown.
- Existing long-term behavior, typo tolerance included, is unchanged; the change
  only adds a path for terms that previously returned nothing.
