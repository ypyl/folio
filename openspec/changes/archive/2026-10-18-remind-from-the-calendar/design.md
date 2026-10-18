# Design

## Context

See proposal.md. The shipped reminders change (archived) put creation and display
in a right-panel section and derived occurrences without writing. ADR-0031 records
that decision. The calendar day cell is a `<button>` in `JournalCalendar`, which
`Sidebar` renders and which already owns the Files row context menu
(`RowContextMenu`). The editor seam has `appendMarkdown`, used to record a
reminder into the open day.

## Goals / Non-Goals

**Goals:**
- Set a reminder from the day it anchors, acting on the open page.
- Make the day's note hold the occurrence, so no panel section is needed.
- One rule per page.

**Non-Goals:**
- A background scheduler. Only an opened day is materialized.
- A calendar marker for reminder days (a possible follow-up, not this change).
- Off-screen delivery, OS notifications, per-occurrence state.

## Decisions

**D1: The day cell owns the menu; Sidebar owns its state.** `JournalCalendar`
gains an `onDayContextMenu(event, date)` prop and calls it from each day cell's
`onContextMenu`. `Sidebar` already owns the row menu's state and renders
`RowContextMenu`, so the day menu reuses it. App supplies the items' handlers.

**D2: The open page is the target, the clicked day the anchor.** The menu items
are `Once, on this day`, `Every day`, `Every week`, `Every month`, `Every year`,
and `Remove reminder` when the open page already has a rule. With no open page,
or a board open, the day menu shows no reminder items. Choosing a recurrence sets
the page's single rule (one rule per page, so a second choice replaces the first).

**D3: A due reminder materializes on open, through the editor.** When a journal
day's editor mounts, the app finds the rules that match the day and whose page
the note does not yet reference, and appends one `referenceToken` line per rule
through `appendMarkdown`. The append runs the normal change handler, so the draft
and saver write it; the editor shows it immediately. Materializing at editor
mount (not on a bare navigation or a background pass) is what keeps it to the one
day the user is looking at, and idempotence holds because a written line makes
the day reference the page, so the next open appends nothing.

Alternative considered: write through `upsertPage` on navigation. Rejected
because the editor seeds its content once at mount, so an external write would
not show until a reopen, and it would write days the user never opened.

**D4: The badge counts the open day's matching rules.** `dueCount(rules, day)` is
the number of rules that match the open day, written or not, so the badge is
stable after materialization. It replaces the pending count.

**D5: The panel section, its form, its candidate list, and its record action are
removed.** `MetaPanel` returns to Contents and Links. `dayReminders` and
`ReminderRow` are replaced by a pure `matchingRules(rules, day)` (reminders.ts)
and `unreferencedRules(graph, rules, day)` (rows.ts), which the badge and the
materializer use.

**D6: ADR-0032 supersedes ADR-0031.** ADR-0031 said occurrences are derived and
never written. The new decision is that a due occurrence is written into the
day's note when the day is opened, and the section that made derivation useful is
gone. ADR-0031 gets a `Superseded by 0032` status and a link.

## Risks / Trade-offs

- **Opening a due day writes a line.** That reverses the navigation rule that a
  merely opened page creates no file. Bounded: one line per rule per day, only on
  a day a rule matches, and only when the note does not already hold it.
- **A deleted line returns on the next open.** The rule is still due, so the
  materializer re-adds it. Removing the reminder is the way to stop it. Accepted
  and documented.
- **Many due rules on one day** append several lines in one edit. Fine; the
  append is one transaction per rule and the saver batches them.
- **The day menu needs the open page.** With nothing open the reminder items are
  absent, so the menu may read as empty; the day cell then behaves as before.
