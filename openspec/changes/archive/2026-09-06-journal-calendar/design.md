## Context

The Journal section is an accordion body that today renders a flat list of `journals/` files (`Sidebar.tsx` -> `renderRow`). The plan (PLAN task 10) replaces it with a calendar. The expensive half of the feature already exists: navigating to `journals/YYYY-MM-DD.md` runs the links-pane path — a missing file opens as an in-memory blank (`pendingBlank` in `App.tsx`), and the first save materializes it via `upsertPage` -> `storage.write`, which creates the `journals/` directory if absent (`resolveDir { create: true }`). Day titles already come from `stem()` (`2026-09-06`) and `kindOf()` classifies the `journals/` prefix. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- A Sunday-first month grid that owns the Journal section, fed by the existing index (ADR-0004), with day cells marking vault days.
- Real navigation: any day click opens `journals/YYYY-MM-DD.md`, create-on-write included.
- Component stays a dumb, prop-driven child of `Sidebar` (App unchanged apart from one flag).

**Non-Goals:**
- No auto-creation of day files, no templates, no stats/streaks, no agenda view, no calendar options.
- No new dependencies and no storage/index changes: the calendar derives everything from paths and the graph.

## Decisions

**D1. Calendar owns the section; the day list is removed.** The flat list of journal rows goes away (user decision A1). Consequence: non-date files under `journals/` (e.g. `journals/notes.md`) are no longer surfaced — `journalDate()` returns null for them and the grid has no cell. Parked as a Later idea rather than handled here.

**D2. Grid construction.** Sunday-first (user decision); render a fixed 6 rows x 7 columns (42 cells) anchored at the Sunday on or before the 1st of the displayed month. Cells whose day falls outside the displayed month render dimmed (`--stone`) but remain clickable days. 42 cells keeps row height stable across months with no layout shift. The header carries previous/next month controls (chevrons) for view-only month browsing — the explicit path to older journals — plus the Today control; out-of-month clicks remain a second, click-a-day month hop.

**D3. Cell states use existing Kami tokens.** Base day number in `--stone`; a day with a journal file gets a `--brand-tint` background fill; the open day adds a `--brand` ring (outline); today's number is emphasized with the `--brand` text color. States compose (e.g. today-with-file-and-open renders fill + ring + emphasized number). Weekday header row above the grid (`S M T W T F S`) in `--stone`.

**D4. Month view: local state anchored to the open day, browsable by chevrons.** The displayed month is component-local `useState`, seeded from the open day's month (else the current month). The day-cell click handler always re-anchors the view to the clicked day's month after navigating; a small effect re-anchors on any other navigation that changes the open day (e.g. a future links-pane row pointing at a journal). Chevron clicks only move the view. The effect is flagged `oxlint-disable-next-line react/set-state-in-effect` — this is the legitimate external-prop sync case (the view is independent of props between navigations precisely because chevron browsing exists). Outcomes: browsing old months never opens or creates a day; opening a day always lands the grid on its month.

**D5. Date derivation is local-calendar math, not UTC.** Day numbers and month navigation use `new Date(y, m, d)` local components; the path form `YYYY-MM-DD` is built from local `year/month/day` (never `toISOString()`, which shifts a day at local midnight boundaries). A single pure helper `journalDate(path)` in `src/vault/index.ts` (next to `stem`/`kindOf`) returns `'YYYY-MM-DD' | null` for `journals/\d{4}-\d{2}-\d{2}.md` paths; the component derives the existing-days set from the `journalEntries` prop by mapping each entry's path through it.

**D6. Wiring stays prop-driven (Sidebar never imports the vault).** `Sidebar` gains a `hasVault: boolean` prop (App passes `graph !== null`); when false, the Journal section renders nothing (its accordion body stays empty, per the no-folder spec). When true, `JournalCalendar` receives `{ journalEntries, activePath, onSelect }` — the same props the list rows used — and renders instead of `renderRow`. `useState` month state and the date set are internal to the component; App and `useIndex` are untouched except the one flag.

**D7. Click semantics are identical to sidebar rows.** `onSelect('journals/2026-09-06.md')` -> `handleSelect` -> `drafts.open(path, content)`, and the existing `pendingBlank` synthesis turns a missing day into a blank in-memory page (blank iff the draft was seeded from an absent file, `saved === ''`). No new state, no leak: the day's first save materializes the file, the graph gains the day, the grid fills the cell (D3) and the blank projection disappears.

## Risks / Trade-offs

- **Non-date journal files become invisible** (D1) — accepted; parked in PLAN Later ideas.
- **Grid width:** 7 columns inside the 240px rail fit ~29px cells; day numbers render at the small text size. No overflow risk with `overflow: hidden` on cells.
- **Month-follow effect** must not fight the user's month hopping: the effect keys on the open day's path only, so clicking out-of-month cells (which both navigate *and* move the view) settles in one render.
- **No mouse-wheel or drag month change** — a deliberate cut, not needed for v1.