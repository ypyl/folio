# Design

## Context

See proposal.md. The day menu is opened by `Sidebar.openDayMenu`, which already
refuses when the reminders feature is off or when no page is open. Days are
zero-padded `YYYY-MM-DD` strings, so a plain string comparison orders them.

## Decisions

**D1: Refuse when the clicked day is before today.** `openDayMenu` returns,
without preventing the browser's own menu, when `date < today`. `today` is a
`Sidebar` prop defaulting to the local day, so a test can pin it; `App` leaves
the default, which reads the real local date through `localDayString` (the same
helper the journal already uses). String comparison is correct because the date
is zero-padded.

Alternative considered: block only `Once` on a past day and keep the
recurrences. Rejected for now because the request is about days before today,
and a recurrence set on a future occurrence still covers the birthday case.

**D2: Today is allowed.** The rule is `date < today`, not `<=`, so a reminder can
still be set for the current day.

## Risks / Trade-offs

- **A yearly reminder for a past month-day needs the next occurrence.** The user
  navigates to a future year's same day. The rule then fires from that year on,
  which is correct.
