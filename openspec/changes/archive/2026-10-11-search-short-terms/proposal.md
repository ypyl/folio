# Proposal

## Why

A query whose terms are shorter than three characters returns nothing. A page
titled `UX` cannot be found by typing `UX`, and neither can a vault's `AI`, `CI`,
or `C#` pages. The three-character floor was added to keep fuzzy matching from
turning short fragments into noise, but it also removed the ability to find short
names by typing them.

## What Changes

- Search accepts every non-empty query. Terms of three or more characters keep
  today's behavior: literal match, with fuzzy tolerance for typos.
- A term shorter than three characters matches only as a whole word, compared
  case-insensitively, so `UX` finds the word `UX` and never the `ux` inside
  `Linux`.
- A query of one or two characters that matches nothing deploys nothing, so the
  empty state does not appear while a short prefix is still being typed. A query
  of three or more characters that matches nothing keeps its empty state.
- **BREAKING** (spec-level): the "query of at least three characters" deploy
  rule and the "every term of at least three characters" match rule are removed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `search`: short queries of one or two characters become searchable as whole
  words, and the deploy threshold drops from three characters to non-empty.

## Non-goals

- No change to fuzzy matching for terms of three or more characters. Typo
  tolerance and the strict threshold stay as they are.
- No change to ranking tiers, grouping, labels, snippets, per-group caps, or the
  results view.
- No new search backend, index, or scoring model. The corpus stays the in-memory
  vault index (ADR-0001, ADR-0004).
- Short terms do not match inside a longer word, so `UX` will not surface
  `Linux`. This is deliberate; see design.md.
- The empty state is not extended to short queries that match nothing; those
  deploy nothing, as they do today.
- No `.folio/` or on-disk change. Search reads only the index already in memory.

## Impact

- Code: `src/search/core.ts` (term splitting, short-term matching, range
  preference) and `src/components/SearchSpotlight.tsx` (a short query that
  matches nothing deploys nothing).
- Tests: `src/search/core.test.ts`, and one spotlight case for a two-character
  query.
- Spec: `openspec/specs/search/spec.md`, three requirements.
- No VaultStorage, filesystem, or storage change. No ADR needed: this refines a
  search rule and adds no architectural decision.
