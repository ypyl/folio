# ADR-0031: Reminders are derived from rules and never materialized

- Status: Accepted
- Date: 2026-10-18

## Context

Users want recurring reminders, such as a friend's birthday or a monthly bill,
without Folio becoming a task manager or a scheduler. The app has no backend and
cannot wake a closed tab, so a reminder can only mean "show me this when I open
the app on a matching day".

Two ways to build that exist. The app could write occurrence lines into journals
(materialization), the way a scheduler ticks. Or it could store rules and evaluate
them on open (derivation). Materialization puts app-generated lines into the
user's prose, which conflicts with ADR-0001 (the folder is the user's and derived
data lives only in cache) and with the navigation rule that opening a day writes
nothing. It also leaves orphan lines when a rule is deleted, and a daily rule
would write hundreds of lines a year. ADR-0015 already gives the app a `.folio/`
corner for its own plain-Markdown state, which pins use.

## Decision

**A reminder is a page, its schedule is a rule in `.folio/reminders.md`, and its
occurrences are derived, never materialized.** The app evaluates the rules
against the open day and shows the result. Opening a day writes nothing.

The only reminder content the app ever writes is one reference line, and only
when the user acts on a pending reminder. That line is the occurrence's record
and the backlink that builds the reminder page's history, so the page becomes a
log of its own occurrences for free.

A rule carries a recurrence (`once`, `daily`, `weekly`, `monthly`, `yearly`), an
anchor date, and an ADR-0012 reference to the reminder page. Matching is a pure
function of the rule and the day; a date a period does not hold (the 31st of a
short month, February 29 in a common year) is skipped, not moved.

A "notification" means the on-open list and the app-icon badge. The app never
reaches a closed tab, and it does not try.

## Consequences

- The journal stays authored by the user: the app writes only what the user
  triggered, and browsing creates nothing.
- Recurrence costs no stored state. A rule is a match function over the day, so
  there is nothing to expire and no scheduler to run.
- Reminders cannot reach a closed app. The on-open list and the badge are the
  ceiling, and a dependable closed-app reminder would need a server, which
  ADR-0006 keeps out.
- Rules live in `.folio/` under ADR-0015, plain and editable by any tool; a
  malformed rule is ignored like a malformed pin.
- Per-occurrence completion is only the written reference line. There is no
  separate done-state, no streak, and no completion history beyond the page's
  backlinks.
- Removing a rule stops future occurrences and leaves the record: the reminder
  page and the journal lines already written are untouched, because the lines
  are the user's notes and the page's history, not the schedule.
- A later decision to materialize occurrences, or to add a real scheduler, needs
  a new ADR; this one records why we did not.
