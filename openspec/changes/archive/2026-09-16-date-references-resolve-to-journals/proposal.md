## Why

A reference to a date does not reach the date's journal entry. `#[[2026-09-16]]` resolves through the index's name map; when no journal file exists for that day the map has no entry, so the app falls back to `pages/2026-09-16.md` and opens a page named after a date. The same reference resolves to `journals/2026-09-16.md` once that file exists, so one name means two different files depending on whether the day was ever written. That contradicts ADR-0012's one namespace (a reference resolves to the page whose name is the referenced text), and it makes the journal calendar the only surface that can reach a day.

## What Changes

- A reference name that is a valid calendar date resolves to the journal day `journals/<date>.md`, whether or not that file exists. Both lexical forms follow the rule: `#2026-09-16` and `#[[2026-09-16]]`.
- A name that is not a valid date keeps today's rule: the existing page if one exists, otherwise a blank page under `pages/`. `2026-13-45`, `2026-9-6`, and `09-16-2026` are not dates and stay pages.
- The index stops deriving a page from a `.md` file under `pages/` whose filename stem is a valid date. Such a file is invisible to the app: no sidebar row, no search hit, no backlinks, no name-map entry.
- **BREAKING** for a vault that already holds a date-named file under `pages/`: that file disappears from the app. The file stays on disk and other tools still see it, but Folio no longer shows it anywhere.
- Navigation behavior does not change. Opening a journal day still creates nothing; the file appears on first save, exactly as it does now.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-references`: a reference whose name is a valid calendar date names the journal day for that date, not a page under `pages/`.
- `vault-index`: a Markdown file under `pages/` with a date stem produces no page, and the name map never resolves a date name to a `pages/` path.
- `static-navigation`: a Forwardlinks row whose reference names a date opens the journal day for that date.

## Impact

- `src/App.tsx`: `handleOpenReference` and the Forwardlinks row builder, the two places that turn a reference name into a path.
- `src/vault/index.ts`: `isPagePath` and the name folding, plus one shared date predicate next to `journalDate`/`localDayString` so the resolver and the index cannot disagree.
- Tests: `App.test.tsx`, the links-pane navigation tests, and the vault index tests.
- `adr/`: a new ADR, `0019-date-names-are-journal-days`, because the change claims a name shape inside the user's folder and hides matching files from the app. That is a narrow carve-out of ADR-0001's "every file belongs to the user", in the spirit of ADR-0015, and it settles how ADR-0012's single namespace treats date names.
- No `VaultStorage` change, no dependency change, and no write path touched. Nothing is written to the vault by navigating.

## Non-goals

- No eager creation. Opening a journal day writes nothing, and the file still materializes on first save.
- No migration, move, or read-through for date-named files already sitting under `pages/`. They are ignored, not repaired.
- No change to when files are deleted, and no change to empty files left by emptying an existing page.
- No completion for dates that have no journal file. The picker keeps offering existing pages only.
- No change to the two reference forms, to how a reference renders, or to the journal calendar.
