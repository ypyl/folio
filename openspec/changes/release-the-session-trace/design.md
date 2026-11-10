# Design

## Context

See proposal.md - Why. The pieces that shape the approach:

- `features.trace` is read in exactly one expression, App's
  `experiments = features.trace || prerelease`, which decides whether
  `createSessionTrace` is called and is a dependency of that memo.
- Prerelease state is one `localStorage` key read by `usePrerelease`, and its
  only consumers are that expression and the rail's control.
- Every trace call site downstream already treats the session as optional
  (`session?.event`, `session ?? undefined`), because the demo has no folder. The
  gate is not load-bearing there.
- The trace's own behavior is independent of the gate: `createSessionTrace` gets
  a storage, and `start`, `flush`, and `end` are idempotent.
- The e2e already runs with `VITE_TRACE=1`, which is what a promoted build is, so
  the browser coverage of the engine does not change with this release.

## Goals / Non-Goals

**Goals:**

- Delete the gate rather than pin it open: no `features.ts`, no `true` constant,
  no unread preference, no control that switches nothing.
- Keep the trace engine, its events, its retention, and its failure isolation
  byte for byte.
- Leave the demo's no-trace rule and its test intact.

**Non-Goals:**

- No opt-out and no settings surface. The files are removable by hand, and the
  pruner owns the rest.
- No change to the trace's privacy rule, its 2000-line cap, or its seven-day
  retention.
- No compatibility shim for `folio.prerelease`.

## Decisions

### D1: The gate is deleted, not flipped to a constant

`features.ts` and `prerelease.ts` are deleted and App's session memo becomes
`rawStorage && !demoVault ? createSessionTrace(rawStorage) : null`. A constant
`trace: true` would keep a module whose only job is to be true, and the same
argument retires the experimental switch: with its last flag released, it can
change nothing, so a visible toggle promising "experimental features" would be
false.

Alternative rejected: keep the switch hidden while nothing is flagged. That keeps
an unread preference key, an unused hook, and a spec for a control nobody can see.

### D2: The session starts with the folder, and that is the whole rule

The existing effect already starts on session identity and ends with
`folder-changed`, so deleting the gate leaves the lifecycle unchanged: one session
per active folder's storage, ended when the folder stops being active. The
`session?.` calls stay optional because the demo still produces no session.

### D3: The e2e stops forcing the flag

`playwright.config.ts` drops `VITE_TRACE`, so the suite exercises the build a user
gets. The diagnostics test loses its switch clicks and asserts the trace from the
first edit; the workspace test that checked the control's popup is deleted with
the control.

### D4: The docs state the trade the gate hid

The README's Diagnostics section becomes a description of a feature, including
what it writes and what it never writes, since every user now has it. ADR-0035's
paragraph about the gate is replaced by the release decision and its reasoning.

## Risks / Trade-offs

- [Every folder now gains `.folio/logs/`] → The trace is bounded by design: no
  page text, a 2000-line cap per file, seven days of retention, and one file per
  session. The README states it plainly, and a user who wants it gone deletes the
  files.
- [`.folio/logs/` shows up in a folder the user shares or syncs] → It is
  dot-named and outside the index, exactly like `.folio/pins.md`; the trace
  content is paths, sizes, and timings only, safe to hand over.
- [Deleting the prerelease mode removes a built mechanism] → It is one change of
  history away, and re-adding it with a future flag is smaller than keeping a
  preference store, a rail control, and a spec that gate nothing.
- [Tests that assert a folder's contents may now see a log file] → The index
  ignores hidden segments, and the App suite's trace block already reads
  `.folio/logs/`; any assertion that breaks is about the folder listing, and the
  suite run is the check.
