# ADR-0035: A session trace lives in `.folio/logs/` and is pruned

- Status: Accepted (amended 2026-11-10: the trace ships in every build)
- Date: 2026-11-05

## Context

A note the user had typed into was later found empty, and its Markdown file was
not where they expected it, with nothing on disk to explain how either happened.
The plausible causes all live in one place: a write that failed, a flush that
never landed, an edit the app never received, or another program (a cloud-sync
client, a restart) changing the file underneath an open vault. Folio could not
tell those apart after the fact, because it kept no record of what it did.

ADR-0015 already reserves `.folio/` for small, app-owned, plain-text state that
travels with the folder. A diagnostic log is exactly that, but it is the first
app-owned state that is *disposable*: it is not rebuildable, it is regenerated
every session, and it must not accumulate.

ADR-0030 removed `delete` from `VaultStorage` because no caller needed it, and
said the method returns "under that change, with the caller that needs it". Seven
days of retention needs a caller: an old log has to stop existing.

## Decision

**The app keeps one plain-text trace file per vault session under
`.folio/logs/`, pruned to seven days.**

- **One file per session**, named for the session's UTC start
  (`2026-11-05T20-03-12Z-4f2a.log`) with a random suffix so two tabs cannot
  collide. A session begins when a real folder becomes active and tracing is on,
  and ends when either goes away.
- **Plain text, one event per line**, each with a timestamp, a level, an event
  name, and a JSON payload. Readable on its own and greppable; open format per
  ADR-0015.
- **What it records:** the session's start (version, folder, browser), each scan
  and refresh with its counts, the pages a refresh saw added, changed, or
  vanished with their sizes before and after, page opens, every write with its
  size and outcome, every failed read, write, or stat with the error, flushes,
  uncaught errors, and the session's end. All of it comes either from the
  `VaultStorage` decorator, which sees every write by construction (ADR-0003), or
  from the layer that knows the intent.
- **No page text.** Paths, sizes, counts, durations, and error messages only. The
  log must not become a second copy of the vault, and it must be safe to hand to
  someone else when reporting a problem.
- **Best-effort, off the typing path.** Lines are buffered and written on a
  short debounce; a failed log write changes no action's result and surfaces no
  error. The only trace work a keystroke does is one map lookup the editor path
  already makes.
- **Retention: seven days.** At the start of a session, trace files whose name
  dates them more than seven days back are removed. Only names this app writes
  are candidates; anything else in the directory is left alone.

**`VaultStorage` regains `remove(path)`.** Its one caller is the trace's pruner,
and the pruner only passes paths under `.folio/logs/` that match its own name
pattern. This is the return ADR-0030 anticipated. The seam is still read/write
for every user file: the app never removes a page, a journal day, a board, a
file, a pin, or a reminder rule.

**The trace runs for every real folder.** It first shipped behind a build flag
plus the app's experimental switch (`release-reminders`' mechanism, restored by
this change). That gate retired in `release-the-session-trace`: the trace was
its last flagged feature, so the flag, the switch, and the mode went, and a
folder being open is now the whole condition. A demo vault still writes nothing,
because it has no folder behind it.

## Consequences

- The next incident is answerable from the vault itself: a `page-changed` line
  with `before` and `after` sizes, and a `write` line for every save, name what
  the app did and what something else did.
- `.folio/` gains its second kind of content: state that is discarded rather than
  rebuilt. It stays plain text, dot-named, and outside the page index.
- A folder under a cloud client will sync these files. Volume is bounded by the
  2000-line cap per file and by the seven-day window. There is no opt-out: a user
  who wants no trace deletes the files, and the pruner owns the rest.
- The log shares the folder it describes. When the folder is broken enough that
  the log cannot be written, only `console.warn` remains, and the file written
  earlier in the session still holds the story up to that point.
- `remove` is on the seam again, with one guard at its one caller. A future
  feature that wants to delete a user file still needs its own decision.
