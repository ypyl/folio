# Design

## Context

See proposal.md. What the existing code gives us:

- `VaultStorage` (ADR-0003, ADR-0013) is the only way the app reaches a folder, so
  one decorator over it sees every read, write, stat, and listing the app makes.
  That is the whole story of what the app did to the user's files, by
  construction.
- `useVault` is the app composition layer that constructs a storage per folder;
  `useIndex` owns the scan, the refresh diff, and every write-through.
- `App` owns the debounced saver, the drafts, and the flush on hide.
- `.folio/` is app-owned state in the vault (ADR-0015), already excluded from the
  page index and search by the hidden-segment rule. `.folio/pins.md` and
  `.folio/reminders.md` are the precedent for a small plain-text file.
- `VaultStorage` has no `remove` (ADR-0030: no caller needed it).
- The build-time flag (`src/features.ts`) and the experimental switch
  (`src/prerelease.ts`, rail control) retired with the reminders release.

## Goals / Non-Goals

**Goals:**

- Answer three questions after a lost edit: did the app see the edit, did it
  write the file, and did something else change or remove the file.
- Leave the keystroke path exactly as fast as it is now.
- Never make a broken folder worse: no new failure mode in any user action.

**Non-Goals:**

- A log viewer, an export control, remote reporting, or replaying a session.
- Configurable level, retention, or destination.
- Tracing anything the app never does through `VaultStorage`.

## Decisions

### D1: One storage decorator, plus named events where the intent lives

The trace is two things:

- **A `VaultStorage` wrapper** that records every write (path, size, duration,
  outcome), every failed read or stat with its error, and each listing's count.
  Writes are the interesting half and they are all here by construction; reads
  and stats are recorded only when they fail, because an 800-file scan would
  otherwise write 800 lines.
- **Explicit events** from the layer that knows the intent: `App` for the session,
  page opens, the first keystroke of a dirty burst, flushes, and uncaught errors;
  `useIndex` for each scan and for what a refresh saw change.

Alternative rejected: instrumenting each save path by hand. It misses writes the
app makes for its own reasons (pins, reminders, the pruner) and would drift.

### D2: Buffered lines, whole-file rewrite, short debounce

`VaultStorage` has no append, so a flush rewrites the session's file from the
lines held in memory. Lines are buffered and written on a 1 s debounce armed by
the first line after a flush, and flushed immediately when the tab is hidden, the
page goes away, or the session ends. The buffer is capped at 2000 lines: past the
cap the oldest quarter is dropped and a `log-truncated` line marks the cut, so a
long session's file stays bounded (about 200 KB) and a flush stays one small
write.

Flushes are serialised through one promise chain, so two flushes never race on
the same file.

Alternative rejected: reading the file back and appending. It is the same cost
as rewriting from a buffer, plus a read that can fail.

### D3: One file per session, named for its start, plain text

Path: `.folio/logs/<YYYY-MM-DDTHH-MM-SSZ>-<4 hex>.log`, UTC so names sort and
retention is arithmetic. The random suffix keeps two tabs that open the same
folder in the same second from sharing a file.

One line per event:

```text
2026-11-05T20:03:12.345Z info  session-start {"version":"0.84.1","folder":"notes","ua":"Mozilla/5.0 ..."}
2026-11-05T20:03:12.412Z info  scan {"files":812,"pages":640,"ms":190}
2026-11-05T20:03:15.001Z info  page-open {"path":"pages/Inbox.md","bytes":1204}
2026-11-05T20:04:02.884Z info  edit {"path":"pages/Inbox.md","bytes":1310}
2026-11-05T20:04:04.010Z info  write {"path":"pages/Inbox.md","bytes":1310,"ms":3}
2026-11-05T20:09:41.226Z warn  page-changed {"path":"pages/Inbox.md","before":1310,"after":0}
2026-11-05T20:09:41.227Z info  flush {"trigger":"hidden","writes":0}
2026-11-05T20:10:02.000Z error write-failed {"path":"journals/2026-11-05.md","bytes":88,"error":"NotAllowedError: The request is not allowed by the user agent"}
```

Plain text with a JSON payload on each line: readable on its own, and one `grep`
or `jq` away from a table. It is the open format ADR-0015 asks for.

### D4: Seven days of files needs `remove`, and only the pruner calls it

Pruning cannot be done by overwriting: an old session file has to stop existing.
So `VaultStorage` regains `remove(path)`, implemented as `removeEntry` on the
parent directory, with the same path contract as the other methods. Its only
caller is the trace's pruner, and the pruner only ever removes a path under
`.folio/logs/` that matches the trace file's own name pattern.

This is the return ADR-0030 anticipated ("the method returns under that change,
with the caller that needs it"): the app's own state file, not a user file.
ADR-0035 records the decision and ADR-0030 gains the amendment in its status
line.

Alternatives rejected:

- **Never prune.** The directory grows for the life of the vault. Users would
  delete it by hand, which is worse than a bounded directory.
- **One file per day, overwritten.** Bounded with no `remove`, but it loses the
  per-session separation that makes a session readable, and an unused app would
  keep stale day files anyway.
- **A tombstone (empty) file.** Leaves hundreds of empty files and reads as a
  cookie trail.

### D5: Paths and sizes, never text

A trace that copies page content becomes a second copy of the vault: it doubles
the write volume, leaks what the user wrote into a file they will share when they
report a bug, and grows without bound. Sizes answer the question ("this was 4 KB
at 20:03 and 0 at 20:09") without any of that.

### D6: The gate is the flag or the switch, computed once in `App`

`features.trace` comes from `VITE_TRACE=1`, off in the shipped build. The
experimental switch is restored from the `add-prerelease-mode` change: the
`localStorage` preference, `usePrerelease`, and the rail control before the tour
control. The effective gate is `features.trace || prerelease`, read once in `App`
and used in one place: whether the open folder's storage is wrapped.

The trace lives in `App`, not in `useVault`, because the gate can flip mid-session
and `App` is where that state is. The wrapped storage is memoised on
`(raw storage, gate)`, so:

- opening a folder wraps once, before the first scan (`useIndex` sees a stable
  storage and scans once);
- a click that re-grants the same folder keeps the same storage object, so
  nothing is re-wrapped;
- flipping the switch re-wraps, which rebuilds the index once — a user-initiated
  action, not the typing path.

A demo vault is never wrapped: it has no folder, so its trace would be written to
memory and thrown away.

### D7: Which events come from where

| Event | Source |
|---|---|
| `session-start`, `session-end` | `App`'s session effect |
| `scan` | `useIndex`, after a build publishes |
| `page-added`, `page-changed`, `page-vanished` | `useIndex`, diffing the new index against the previous one |
| `page-open` | `App`, where the draft is seeded |
| `edit` | `App`, on the first keystroke of a dirty burst only |
| `write`, `write-failed`, `read-failed`, `stat-failed`, `list` | the storage wrapper |
| `flush` | `App`'s hide/pagehide listener and the saver's disposal |
| `prune`, `log-truncated` | the session sink |
| `error` | `App`'s `error` and `unhandledrejection` listeners |

The refresh diff is the event that answers the reported incident directly: a page
that the app last wrote at 4 KB and that a refresh now reads as 0 bytes names the
cloud client, not the app.

### D8: Failure isolation, and the keystroke budget

Every record call is `if (sink === null) return` and then a buffer push. Flushes
are async, awaited by nothing the user waits for, and their rejections are caught
and reported once to `console.warn` so a broken folder cannot loop. The log write
goes through the raw storage, never the wrapper, so it cannot recurse into the
trace.

What the trace adds to the keystroke path: on `handleChange`, one `DraftStore`
status read that already happens, and a reference comparison to decide whether
this keystroke is the first of a dirty burst. No allocation, no timer, no I/O.
Everything else runs on a save, a refresh, a lifecycle event, or a log flush.

Cost scales with: one 1 s-debounced file write per burst of events (bounded to
200 KB by the cap), and one pass over the page map on a refresh that already read
the folder.

## Risks / Trade-offs

- **A log in the vault is sync churn.** A folder under a cloud client will sync
  each session's file. It is bounded by the line cap and the directory by
  retention, and the feature is off by default.
- **The log shares the folder it describes.** When the folder itself is what is
  broken, the log write can fail too. The session file written earlier in the
  session still holds the story up to that point, which is why the debounce is
  short and the flush also fires on hide and on end.
- **A hard kill loses the buffered tail.** Up to one debounce window (1 s). The
  alternative — writing per event — puts a file write behind every save
  completion.
- **`remove` returns to the seam.** One method, one caller, and a name pattern
  guard; ADR-0030's promise about user files still holds, since a trace file is
  the app's.
- **The gate flip rescans the folder.** Once per flip, on a control click.
- **StrictMode runs the session effect twice in development.** The sink is
  created by `useMemo` (allocation only) and `session-start` is guarded by a
  started flag, so the double mount writes one file and one header.
