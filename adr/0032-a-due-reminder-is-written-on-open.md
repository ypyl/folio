# ADR-0032: A due reminder is written into the journal day when it is opened

- Status: Accepted
- Date: 2026-10-18

## Context

ADR-0031 decided that reminders are derived from rules and never materialized,
with a right-panel Reminders section as the surface that showed a day's pending
and recorded rows. That section was rejected in use: a reminder belongs on the
calendar day it anchors, and the gesture that sets one is the same as favoriting
a page, an item on a context menu. Removing the section left a pending reminder
with no surface at all, because a derived occurrence is invisible unless
something renders it.

The user's own model is simpler: the journal has the reminder when it has a line
referencing it. That means the app should write the line, and the day's own note
is the surface. This supersedes ADR-0031's derive-never-write rule while keeping
its core: a reminder is a page, its schedule is a rule in `.folio/reminders.md`,
and its occurrences are derived from that rule.

## Decision

**A reminder is set from the Journal calendar's day menu.** The menu acts on the
open page as the target and the clicked day as the anchor, offering `Once, on
this day`, `Every day`, `Every week`, `Every month`, and `Every year`, and
`Remove reminder` when the open page already has a rule. A page has at most one
rule; a second choice replaces it.

**A due reminder is written into the day's note when the day is opened.** When a
journal day's editor mounts, the app appends one unchecked task item for each
rule that matches the day and whose page the note does not already reference.
The line is `- [ ] ` followed by the rule's reference, so the occurrence arrives
with the control that records it (`materialize-a-reminder-as-a-task-item`). The
write goes through the editor's own insertion path, so the note shows the line
and the normal save persists it. Only the day being opened is written, and the
write is idempotent: a written line makes the day reference the page, so the
next open appends nothing. The app writes no other reminder content, and no
background pass writes any day the user did not open.

**The app-icon badge counts the open day's matching rules**, written or not,
less the ones the day's note records as done: a rule whose page a done task
item (`- [x] … #[[Page]]`) references in that note no longer counts, because a
tick is the user's own record that the reminder was acted on. The count reads
the note's saved text, so it follows the save rather than the press.

## Consequences

- The journal is the reminder surface. Opening a due day shows its occurrences as
  task items, and the reminder page's backlinks become the history of every day
  it was referenced.
- The line is an ordinary checklist item, so ticking it is the whole gesture: a
  three-character edit (ADR-0033) that clears the badge once the save lands. A
  bare reference line written before this decision still counts as the day's
  occurrence and is left alone.
- Opening a journal day that a rule matches writes its file, an exception to the
  rule that merely opening a page creates nothing. The exception is bounded to
  the day being opened and to one line per rule.
- A line the user deletes returns the next time the day is opened, because the
  rule is still due. Removing the reminder is the way to stop it.
- A ticked reminder line is both the record and the reason the badge clears: the
  rule stays live for later days, the note keeps its line, and the page's
  backlinks keep the day. The badge lags the tick by the save it waits on.
- The right-panel Reminders section, its form, and its record action are gone;
  creation and removal live on the calendar, and the day's note is the record.
- Recurrence still costs no per-occurrence state beyond the written line, and
  there is still no scheduler and no off-screen delivery.
