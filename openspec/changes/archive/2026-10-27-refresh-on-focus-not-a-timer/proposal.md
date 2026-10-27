# Proposal

## Why

The index re-lists the whole vault and stats every page every 30 seconds while
the tab is visible. The cost scales with the vault: at 5,000 notes that is about
10,000 file-process round trips per tick, roughly 20 million a day, for a tab
that is sitting open. The README already describes the refresh as happening
when the user switches back to the tab or reopens the folder; the timer is
work nobody asked for.

## What Changes

- **The periodic sweep is removed.** The index refreshes when the window regains
  focus, when the tab becomes visible again, and when the folder opens. Nothing
  runs on a timer.
- **The behavior the app promises stays the same.** A change made outside the
  app still appears without a restart, because coming back to the tab is what
  triggers the scan. A tab left open in view simply holds its current index
  until one of those events.
- **The measurement is recorded.** `scanCost.test.ts` already pins one
  incremental refresh at one stat pair per page; the design states the
  arithmetic that made the timer the wrong shape.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `vault`: the "The vault reflects changes made outside the app" requirement
  names its refresh triggers and states that no timer polls the folder.

## Non-goals

- No change to what a refresh reads, to the incremental diff, or to the
  write-through save path.
- No watcher, no file-system observer, and no new trigger beyond focus,
  visibility, and opening the folder.
- No UI change: no refresh control, no "up to date" indicator.
- No change to the save or failed-save rules.

## Impact

- `src/vault/useIndex.ts`: the interval constant, the interval, and its
  visibility gate are deleted; the focus and visibility listeners stay.
- `src/vault/useIndex.integration.test.ts`: the two interval tests become one
  test that no scan happens on a timer.
- `openspec/specs/vault/spec.md`: the external-changes requirement and its
  scenarios.
- Version: a minor bump (observable behavior); the archive commit carries its
  own patch bump.
