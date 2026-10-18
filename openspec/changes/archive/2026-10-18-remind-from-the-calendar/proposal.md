# Proposal

## Why

The shipped reminders UI puts a Reminders section and an add form in the right
panel. That is a new panel section for a gesture that belongs on the calendar:
you already point at a day there, and you already open the page you want to be
reminded about. Setting a reminder should look like favoriting a page: open the
page, right-click the day, choose the item.

The section also hides the reminder: the day's note never shows it until you
click a pending row. The user's own model is that the journal has the reminder
when it has a line referencing it. That means the app should write the line, and
the section is then redundant.

## What Changes

- **Creation moves to the Journal calendar.** A day cell gains the same context
  menu the Files page rows have. Its items act on the open page as the target and
  the clicked day as the anchor: `Once, on this day`, `Every day`, `Every week`,
  `Every month`, `Every year`, and `Remove reminder` when the open page already
  has one. A board or no open page means no reminder items.
- **One reminder per page.** Choosing any recurrence sets the page's single rule;
  a second choice replaces it. `Remove reminder` deletes it and leaves the
  written lines.
- **A due reminder is materialized on open.** When a journal day is opened and a
  rule matches that day and the note does not already reference the page, the app
  appends one reference line to the day's note. That line is the occurrence, the
  record, and the backlink that fills the reminder page's history.
- **The right-panel Reminders section is removed**, with its rows, its add form,
  its candidate list, and the record action. The panel returns to Contents and
  Links.
- **The badge counts the open day's due reminders** (the rules that match it),
  whether or not the line is already written.
- **ADR-0031 is superseded.** Its rule was derive-never-write; this change writes
  one line per due occurrence on open, which is now the decision.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `reminders`: creation moves from the open-day form to the calendar day menu;
  a due reminder materializes into the day's note on open instead of being
  derived; the record action and its requirement are removed; the badge counts
  due rather than pending.
- `workspace`: the right panel loses the Reminders section and returns to
  Contents and Links.

## Non-goals

- No right-panel Reminders section and no add form in the panel.
- No new reminder surface: the day's own note and the calendar are the surfaces.
- No recurring materialization in the background. Only the day being opened is
  written, and only when it is due and unreferenced.
- No per-occurrence completion state beyond the written line.
- No new recurrence kinds, no RRULE syntax, no scheduling while the app is
  closed, and no OS notification.

## Impact

- `src/components/MetaPanel.tsx` and its CSS: the Reminders section, form, and
  row menu are removed.
- `src/components/JournalCalendar.tsx` and `Sidebar.tsx`: a day cell opens the
  row context menu, and Sidebar owns its state and items.
- `src/App.tsx`: the reminder handlers move to the day menu, and opening a due
  journal day materializes its unreferenced matches.
- `src/rows.ts`: the day's reminders become due rules only (no pending/recorded
  split for the panel); `dayReminders` is reshaped or replaced.
- `adr/0032`: records that a due reminder is written into the day on open,
  superseding ADR-0031.
- Version bump: a minor bump.
