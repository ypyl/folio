# journal-calendar

## Why

The Journal section still shows its placeholder copy ("the calendar arrives in a later step") plus a flat list of day files; PLAN task 10 calls for the real thing. Folio's simplest journaling surface is a month grid: see the days you wrote on, click any day (past, today, or future) to open it, and let the file materialize only when you actually write.

## What Changes

- Replace the Journal section's flat list of journal entries with a **calendar grid** (month view, Sunday-first).
- Days that have a journal file on disk are **marked with a background fill** in the grid; other days are plain.
- Clicking any day opens `journals/YYYY-MM-DD.md` — existing days open their file, days without a file open as a blank in-memory page that **materializes on first save** (the links-pane create-on-write path, which already covers journal days; no orphan files for days merely visited).
- The grid shows the **open day's month** and follows it across navigation; a small **Today** control opens and snaps to today's journal.
- Out-of-month cells (leading/trailing neighbor days) render **dimmed but clickable**, giving free month hopping.
- With no vault open, the calendar is hidden (the Journal section stays empty as specified today).
- **BREAKING (section content):** the Journal section's flat row list is removed — the calendar replaces it. Non-date files under `journals/` (e.g. `journals/notes.md`) are no longer surfaced in the sidebar; recorded as a Later idea.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui-shell`: removes the "Journal section shows a placeholder, not a calendar" requirement and adds the calendar requirement (grid, marks, navigation affordances, no-vault hiding).
- `static-navigation`: the journal-sidebar requirements change from listing rows to rendering the calendar and treating a clicked day as a navigable page; the existing unmaterialized-pages requirement already covers create-on-write for days (its wording explicitly names "a journal day").

## Non-goals

- No automatic daily-note creation (a day file is created only by a save; no on-opening side effects).
- No day templates, month summaries, streaks, or journal stats.
- No week/agenda view, no month-range rendering outside the single grid.
- No calendar options (first-day-of-week toggle, density, week numbers) — Sunday-first is fixed.
- No new date-handling dependency; date strings are derived from day numbers with local-calendar math.
- No new ADR: the change reuses the existing in-memory index (ADR-0004), the Markdown-canonical storage contract (ADR-0001/0009), and the vault-relative path conventions (ADR-0013); no architectural decision changes.
- Non-date files under `journals/` are not shown by the calendar (see a "What Changes" consequence above).