## Why

Search currently orders results purely by Fuse's relevance score. A fuzzy, typo-aligned match can outrank the page whose title is the literal query, so the exact page a user is looking for is not always at the top. Users read "best match first" as "the thing I typed, exactly", and today that is not guaranteed.

## What Changes

- Re-rank results inside each kind group (Pages, Journal, Boards, Assets) by match **tier** before Fuse relevance, so the literal matches lead and the typo matches trail.
- Tiers, best first:
  1. **Exact title**: every query term (>= 3 chars) appears in the title as a literal, case-insensitive substring.
  2. **Exact body**: every term appears literally in the body, but not all in the title.
  3. **Fuzzy title**: the title matched only fuzzily (a typo).
  4. **Fuzzy body**: the body matched only fuzzily.
- Within a tier, keep today's Fuse relevance order, with `path` as the final tiebreak.
- The re-rank applies to both surfaces (the dropdown and the full results view), which share the same ordered list; group order and per-group caps are unchanged.
- Highlighting, snippets, and the matched-block anchor are unchanged: the range logic already prefers exact spans.

## Non-goals

- No change to which results match or the AND-term model; only their order.
- No change to the four kind groups, their order, or the per-group cap.
- No change to Fuse options, weights, or threshold.
- No new search surface, no relevance feedback, no persistent ranking state.
- No backend, no database, no block-based document model.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `search`: "Search matches titles and content across the vault" gains an exact-match-first ordering rule for results within a kind group.

## Impact

- `src/search/core.ts`: `searchDocs` gains a per-result rank tier and sorts on it before score; the `SearchResult` type carries the tier (or the sort uses an internal field).
- `src/search/core.test.ts`: new ordering tests.
- No change to `SearchSpotlight`, `SearchResultsView`, `MatchBody`, or the index; they consume the already-ordered list.
- No ADR change: this is a ranking refinement inside the existing search capability, not a new architectural decision (ADR-0006 "keep it small" still holds).
