# ADR-0019: Date-shaped names are journal days

- Status: Accepted
- Date: 2026-09-16

## Context

Folio derives everything from a folder of Markdown files, and ADR-0012 gives references one namespace: a reference resolves to the page whose name is the referenced text. Journals are the one part of the vault whose pages are named by a rule rather than by the author: `journals/YYYY-MM-DD.md`, with the calendar as the surface that reaches them.

Nothing said where a reference to a date name should land. `#[[2026-09-16]]` resolved through the name map like any other name. When no journal file existed for that day the map had no entry, so the app fell back to `pages/2026-09-16.md`. One name therefore meant two files: the journal day once the day was written, and a page until then. A user who referenced a date to tie a note to a day got a page instead of the day.

## Decision

**A name that is a real calendar day in zero-padded `YYYY-MM-DD` form is the journal day for that date.** It resolves to `journals/<date>.md` whether or not the file exists, in both reference forms. A name that is not a real day (`2026-13-45`, `2026-9-6`, `09-16-2026`) keeps the ordinary rule and stays a page.

Two consequences follow, and both are deliberate:

- **The index does not derive a page from a date-named Markdown file under `pages/`**, at any depth. The file stays on disk and other tools still read it; Folio ignores it the same way it ignores hidden paths and `assets/`.
- **`pages/` is not a home for date names.** A vault that already holds `pages/2026-09-16.md`, which is what the old behavior produced, shows that file nowhere after this change.

This sits alongside ADR-0001 rather than against it. ADR-0001 says the folder is the database; this decision claims one name shape inside it and reserves that shape for journals, in the same spirit as the `.folio/` carve-out in ADR-0015. The ignored file is not deleted, moved, or rewritten, and no migration runs.

The date check is by component, not by `Date` parsing: `new Date('2026-09-16')` is UTC and `new Date(y, m, d)` maps years 0-99 to 1900+. Neither answers "is this a day the calendar can show", so a regex over `Date` would misplace days at both ends.

## Consequences

- A date reference always reaches the day, and backlinks to a date reach that day's entry, with or without a file.
- One name means one file: the calendar and the reference agree.
- A date-named file under `pages/` becomes invisible in Folio. That is a visible surprise for such a vault, accepted because the old behavior created those files by accident and no migration compatibility is owed (ADR-0012).
- A page cannot be named `2026-09-16`; the name belongs to the journal day.
- Opening a day still writes nothing. The day materializes on first save, so this decides where a date name points, not when files appear.
- The scan pays one date check per file, on scans only. The keystroke path is untouched.
