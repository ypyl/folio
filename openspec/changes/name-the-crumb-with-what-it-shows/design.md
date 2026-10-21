# Design

## Context

See proposal.md — Why. The crumb has one rendering path for both kinds of open
item (`StatusBar`), and its name is the only part that differs: the page case
spells the name it is already printing, the day case formats a date from the
crumb's own path. The long date it formats is the same string the calendar's
cells and the day menu carry (`dayLabel`), which is why the day's name was chosen
to match the cell it moves to.

## Goals / Non-Goals

**Goals:**

- The day crumb's accessible name contains the text the crumb displays, so speech
  input can name it by what is on screen.
- One naming rule for both crumbs, stated once in the spec.
- No new state, prop, or formatting on the status bar's render path.

**Non-Goals:**

- Changing the crumb's visible text, or what activating it does. See
  proposal.md — Non-goals.

## Decisions

### D1: The day's name spells the file name, not the long date

The name becomes `Show <file name> in the Journal calendar`, mirroring the page's
`Reveal <file name> in Files`: action, the text on the screen, the surface.

- *Alternative — keep the long date and append the file name*: "Show 2026-10-21.md
  (October 21, 2026) in the Journal calendar". Rejected: one button with two
  names for one thing, and the page crumb already sets the house pattern.
- *Alternative — change the visible crumb to the long date*: rejected as a
  larger behavior change. Every crumb shows the file name; the day would become
  the one crumb that shows a label instead, and the crumb's job is to say where
  the open item lives.
- The long date is not lost to a screen reader: activating the crumb moves focus
  to the day's cell, whose name is that long date, so the destination announces
  the day in the calendar's own words.

### D2: The date-label helper goes back to being private to `months.ts`

`dateLabel` was exported for the status bar's name. With the name spelling the
file name, its only remaining production caller is the module's own
`journalLabel` (the row label for a journal day). Tests that need a cell's name
use `dayLabel(new Date(...))`, the same function the cells call, so they name the
cell the way the app does rather than through a second helper.

### D3: Tighten the requirement instead of adding a second one

The requirement already says the crumb is "named for the item it locates and the
action it performs". It now says the name carries the text it displays, the
action, and the surface, and a scenario pins it for both crumbs. One requirement
for one control; no new capability, no new requirement block.

## Risks / Trade-offs

- **A screen reader hears a raw file name** (`2026-10-21.md`) where it used to
  hear "October 21, 2026" → Mitigation: the action lands focus on the day's cell,
  which is named with the long date, so the pretty form is spoken at the
  destination; and the crumb now matches every other crumb in the bar.
- **The e2e and unit tests look the control up by name** → Mitigation: the name
  change and its selectors land in the same commit, and the e2e runs in the
  change's verification.

## Migration Plan

None: nothing is persisted, no data or file format changes, and both crumbs keep
their visible text and their behavior.
