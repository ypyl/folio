# Proposal

## Why

The status bar's file-name crumb is a control for a page and for a journal day,
and each is named for what it locates. The page's name carries the text the crumb
shows — "Reveal Welcome.md in Files" — so saying what is written on the screen
activates it. The journal day's name does not: the crumb shows `2026-10-21.md`
and the name says "Show October 21, 2026 in the Journal calendar". A
speech-input user reading the bar has no text to say, and a screen-reader user
hears a name that matches nothing on screen, in a bar where every other crumb
speaks the file name. WCAG 2.5.3 (Label in Name) asks that a control's accessible
name contain the text it displays.

## What Changes

- **A journal day's crumb is named with the file name it displays**: "Show
  2026-10-21.md in the Journal calendar". Its visible text does not change, and
  the name still says which surface it locates.
- **The page's name does not change**: "Reveal Welcome.md in Files" already
  starts with the text the crumb shows.
- **The naming rule is tightened in the spec**: the file-name crumb is named with
  the text it displays, the action it performs, and the surface it locates. One
  rule for both kinds of crumb, instead of "named for the item it locates".

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `workspace`: the requirement that the status bar's file name locates the open
  item in the navigation now also fixes how that control is named. Behavior is
  otherwise unchanged: the same actions, the same scenarios, the same page and
  day paths. See ADR-0005 and ADR-0011 — this is a control's label, not an
  architecture decision, so no new ADR.

## Non-goals

- No change to the crumb's visible text. Every crumb shows the file name, and a
  journal day keeps that.
- No pretty-date label on the crumb.
- No change to what activating a crumb does: reveal, locate, scroll, and focus
  stay exactly as they are, for a page and for a day.
- No change to the calendar cell's own name, which stays the long date
  ("October 21, 2026").
- No new control, no keyboard shortcut, and no change to a board's, an asset's,
  or an empty bar.

## Impact

- `src/components/StatusBar.tsx`: the day crumb's accessible name is the file name
  it displays; the bar no longer formats a date for it.
- `src/components/months.ts`: the date-label helper loses its status-bar caller
  and becomes module-private again; the calendar's cells and the day menu keep
  their long-date labels.
- Tests: `StatusBar.test.tsx` names the crumb by its file name; the App
  integration test and `tests/e2e/navigation.spec.ts` look the same control up by
  the new name.
- Version bump: patch (an accessibility fix to one control's name, not a new
  capability).
