# Proposal

## Why

A note the user had typed into was found empty later on, and its Markdown file
was not where they expected it. Nothing in the app recorded what happened, so the
cause stays a guess: a failed write, a debounce flush that never landed, a file
emptied by the cloud-sync client under the folder, or a restart that killed the
tab mid-save. Folio's failure modes are invisible after the fact, which is the
worst property a local-first app can have. A per-session trace in the vault turns
the next occurrence into three greps.

## What Changes

- **A session trace file.** While tracing is enabled, every vault session writes
  one plain-text log to `.folio/logs/<session-start>.log`: folder open and close,
  each scan and refresh, the pages a refresh saw added, changed, or vanished,
  page opens, every write with its size and outcome, failed saves with the error,
  flushes and what they carried, uncaught errors, and the session's end.
- **Seven-day retention.** When a session starts, log files whose name dates them
  older than seven days are removed. Nothing else in the vault is ever removed.
- **`VaultStorage` regains `remove(path)`**, used by the pruner and nothing else.
  This amends ADR-0030, which anticipated the method returning with the caller
  that needs it.
- **The log holds no page text.** Paths, byte counts, durations, and error
  messages only, so the trace never becomes a second copy of the vault and stays
  safe to hand over.
- **Tracing never sits in the way.** It buffers in memory, writes on a short
  debounce, and a failed log write changes no action's result and surfaces no
  error. The editor's keystroke path allocates nothing for it.
- **It ships behind the two-layer gate**, like every capability a user could
  notice: a build-time flag plus the app-level experimental switch. That switch
  retired with reminders, so it returns with this change: `src/features.ts`,
  the rail's prerelease control, and its browser-local preference.
- **A new ADR** records the trace as app-owned state in `.folio/`, its format,
  and the return of `remove` to the storage seam.

## Capabilities

### New Capabilities

- `diagnostics`: the session trace's events, its file location and format, its
  seven-day retention, its privacy limit, its failure isolation, and its gate.
- `prerelease`: the app-level experimental switch, its rail control, its
  browser-local persistence, and its effect of enabling flagged features. This
  capability shipped before and retired with the reminders release; the change
  restores it from history.

### Modified Capabilities

- `workspace`: the folder rail's control order regains the prerelease control
  before the tour control, which stays the rail's last control.

## Non-goals

- No page content, no keystrokes, no search queries, and no draft text in the
  log.
- No log viewer, no export control, no status-bar entry, and no remote reporting:
  the file in `.folio/logs/` is the whole interface.
- No change to when saves happen, how failures are reported in the UI, or the
  flush-on-hide behaviour. The trace observes those paths; it does not alter
  them.
- No configurable retention, level, or destination.
- No tracing while the gate is off: with the flag and the switch both off, the
  app creates no directory, writes no file, and registers no listener.
- No change to the demo vault: it has no real folder, so it writes no trace.

## Impact

- `src/trace/session.ts` (new): the trace sink, its flush policy, the pruner, and
  the `VaultStorage` wrapper that records I/O.
- `src/vault/storage.ts`, `fs.ts`, `demo/storage.ts`, `fakeHandle.ts`: `remove`.
- `src/features.ts` and `src/prerelease.ts` (restored from the
  `gate-reminders-behind-a-flag` and `add-prerelease-mode` changes).
- `src/App.tsx`: creates the per-folder trace, wraps the folder's storage, logs
  lifecycle, editor, save, and error events, flushes on hide, prunes on start.
- `src/vault/useIndex.ts`: scan and refresh events, including external changes.
- `src/components/FolderRail.tsx` and its CSS: the prerelease control.
- `playwright.config.ts`: one e2e run with the flag on.
- ADR-0035 (new) and ADR-0030's status line; `adr/README.md`, `README.md`,
  `DESIGN.md`.
- Version bump: a minor bump for the feature commit, a patch bump for the
  archive commit.
