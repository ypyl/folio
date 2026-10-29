# Proposal

## Why

Search folds every case before it compares, so a query for `Docker` and one for
`docker` are the same search. That is the right default, but a vault of code
notes is full of names whose case carries the meaning: `useMemo` against
`usememo`, `POST` against `post`, `UX` against `ux`. Today a user cannot ask for
the exact spelling, so the match set is either too wide or the wanted page is
buried under every case-insensitive hit.

## What Changes

- **A match-case toggle in the spotlight.** A small `Aa` button sits at the
  right of the search field, beside the clear `×`, and presses to a held state.
  While it is on, the query matches only the case it was typed in.
- **The toggle re-runs the query.** Pressing it re-runs the current query at
  once, no retyping, and both surfaces follow because they are fed by the same
  run. The dropdown and the results view show the same case-sensitive match set.
- **Case sensitivity reaches every match rule.** Literal matches, whole-word
  matches for short terms, fuzzy typo fallback, and snippet highlighting all
  compare with the case the toggle asks for, so a highlighted span is always a
  span the search actually matched.
- **The toggle is part of the query's state.** Closing the spotlight keeps it,
  as it keeps the query; clearing the query resets it, so the next search starts
  from the default. It is session-only: nothing is persisted and no vault file
  changes.
- Operators keep working unchanged: `board: Foo` with the toggle on promotes the
  Boards group exactly as `board: foo` does with it off.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `search`: search gains a match-case toggle that restricts matching, ranking,
  and highlighting to the query's exact case, and the input gains the control
  that sets it.

## Non-goals

- No smart case, no per-term case syntax, and no `case:` operator token: the
  toggle is the only way to ask for case sensitivity, and it applies to the
  whole query.
- No persistence of the toggle across reloads, and no change to a vault: no
  file is read, written, or indexed differently.
- No case-sensitive path for boards and files beyond their names, which are
  matched by the same rule as everything else.
- No change to the default mode. With the toggle off, search behaves exactly as
  it does today, down to the ranking tiers and the snippet ranges.
- No new keyboard chord. The toggle is pressed or tabbed to, not bound.

## Impact

- `src/search/core.ts`: the case flag threaded through `exactRanges`,
  `wordRanges`, and `searchDocs`, and a Fuse options builder that carries
  `isCaseSensitive`.
- `src/components/SearchSpotlight.tsx`: the toggle's state, its press handler,
  and the Fuse rebuild when the mode changes.
- `src/components/SearchSpotlight.module.css`: the toggle's paint, against the
  app's tokens.
- `DESIGN.md`: one rule for the pressed toggle beside the search field's.
- Tests: unit tests for case-sensitive ranges and matching, and spotlight tests
  for the toggle's state, its re-run, and its reset on clear.
- Version bump: a minor bump (a new user-facing capability).
