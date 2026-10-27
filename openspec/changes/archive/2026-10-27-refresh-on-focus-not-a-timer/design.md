# Design

## Context

`useIndex` (`src/vault/useIndex.ts`) builds the index on open and refreshes it
on `window` focus, on `visibilitychange` becoming visible, and on a 30-second
`setInterval` gated by `document.visibilityState`. A refresh re-lists the tree
and stats every page; only pages whose mtime moved are re-read.

`scanCost.test.ts` pins the cost of one incremental refresh: 120 pages cost 120
`getFileHandle` calls and 120 `getFile` calls, plus the directory walk. That is
two file-process round trips per page per refresh, whatever the vault size. At
5,000 notes and a 30-second tick that is 10,000 calls per tick, 1.2 million per
hour, about 20 million a day, for a tab that is open and in view. The new test
in `useIndex.integration.test.ts` counts the ticks directly: ten minutes on a
visible tab ran 20 scans under the timer and none after it.

The README already describes the trigger as "switching back to its tab, or
reopening the folder". The spec's requirement says changes appear without a
restart and that a refresh reflects them; it does not name a cadence.

## Goals / Non-Goals

**Goals:**

- No disk work when the user is not coming back to the app.
- Keep the promise that external changes appear without a restart.
- Delete code rather than add it.

**Non-Goals:**

- A file watcher (the web platform has none for a picked folder).
- Any new UI or manual refresh control.
- Changing what a scan reads or how the diff works.

## Decisions

### D1: Remove the timer; keep the two event triggers

Focus and visibility are exactly the moments the user comes back to the app,
which is when a stale view matters. They cost one scan per return, bounded by
what the user actually does, instead of one every 30 seconds forever. Opening
the folder already builds a fresh index. Deleting the interval also deletes its
visibility gate and the constant, so there is no periodic path left to tune.

### D2: State the triggers in the spec

The requirement now names focus, visibility, and opening the folder as the
refresh triggers, and says a timer does not poll. That is a behavior statement,
not an implementation detail: a future timer would contradict it and need its
own change and its own measurement.

### Rejected: a longer interval

Five minutes is still 2 million calls a day on a big vault and still work nobody
asked for. It also makes the refresh time arbitrary, while focus is a real
signal.

### Rejected: a size-gated interval

Skipping the timer above N pages keeps two behaviors and a magic threshold, and
the small-vault case still pays the same work per page. The trigger, not the
frequency, was the wrong shape.

## Risks / Trade-offs

- A note changed outside the app while the user watches the tab stays stale
  until the next focus or visibility change. The README and the requirement
  already describe the refresh that way, and the work a timer bought was a
  fraction of a second of freshness for a constant disk cost.
- A user who alt-tabs to another app and back gets one scan per return, which is
  the same scan a shorter timer would have run, at the moment they look at it.
- Nothing else depends on the interval: no other code reads `REFRESH_INTERVAL_MS`.
