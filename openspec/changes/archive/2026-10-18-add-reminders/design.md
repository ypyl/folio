# Design

## Context

See proposal.md. The pieces this design builds on already exist: journal days
resolve from date names whether or not a file exists (ADR-0019), references give
a page its backlinks (ADR-0012), the index reads an app-owned `.folio/` Markdown
list (`readPins`) and keeps it in the `VaultIndex`, and app rows are built by
pure functions in `src/rows.ts` and memoized in `App`. The editor is the
Markdown surface (ADR-0029), so derived content cannot be injected into it.

## Goals / Non-Goals

**Goals:**
- A reminder is a page referenced from a day, scheduled by a small rule set.
- Occurrences are derived when the app is open; nothing is written by browsing.
- One action writes one reference line, and that line is the record and the
  backlink that builds the reminder page's history.
- Zero cost on the keystroke path.

**Non-Goals:**
- Off-screen delivery. No service worker scheduling, no push, no server.
- Materializing rules into journals, and no app writes the user did not trigger.
- A general recurrence engine or RRULE syntax.

## Decisions

**D1: A reminder is a page, the schedule is a rule in `.folio/reminders.md`.**
The file is plain Markdown, read on every scan like `.folio/pins.md` (ADR-0015).
One line per rule: `- <recur> <anchor> <reference>`, where `<reference>` is an
ADR-0012 token (`#name` or `#[[name]]`) parsed by the existing scanner, so a rule
cannot name something the app cannot resolve. Example:

```
# Reminders
- yearly 1990-04-12 #[[Ana's birthday]]
- monthly 2026-10-01 #[[Pay rent]]
- daily 2026-10-16 #[[Take pills]]
```

Alternative: the rule written on the reminder page or on the first day's line.
Rejected because it puts behavior into page prose and needs a new scan of page
content; `.folio/` is the app's own corner.

**D2: Rules are match functions, occurrences are derived.** `once` is
`today == anchor`; `daily` is `today >= anchor`; `weekly` and `monthly` add a
phase match on weekday or day-of-month; `yearly` matches on month-day. The
app evaluates them against the local day (the same `localDayString` the journal
already uses). The set of due rules is a pure function of (rules, today).

**D3: Edges are skipped, not clamped.** A monthly rule on the 31st fires
nothing in a 30-day month, and a yearly rule on Feb 29 fires only in leap years.
The date means that day; clamping would fire on a day that is not the
anniversary. Alternative considered and rejected: clamp to the last day.

**D4: A due row is suppressed when the day already references its page.** The
day's own content is read from the index (`IndexPage.links`). If a due rule's
page already appears there, that occurrence is done and is not derived again.
This is also why a one-off can be written as a plain line instead of a rule, and
why `once` rules and written lines never double-show.

**D5: The day's reminders render in the right panel.** While a journal day is
open, the panel gains a Reminders section listing, in this order, the pending
rows (rules that match the day and whose page the day does not yet reference)
then the recorded rows (rules whose page the day already references). A rule
that neither matches the day nor is referenced produces no row, so the section
is the schedule's footprint on that day. The panel is already the page-metadata
surface and already varies by the open item (a board shows Referenced by), so
this is a section, not a new pane. Alternative: a sidebar band. Rejected because
the sidebar is exactly two sections by rule and the panel already owns metadata.

**D6: Setting a rule is one control in that section.** "Add reminder" opens a
small inline form: a page field backed by the existing reference picker pool, a
recurrence select, and the anchor defaulting to the open day. Saving writes the
rule through `VaultStorage` (an `upsertReminders` mirroring `upsertPins`).
Alternative: a slash command or a row context-menu item. Rejected because the
editor has no slash commands and a page row has no day to anchor to.

**D7: Acting on a pending reminder writes one reference line.** Activating a
pending row inserts `<reference>` at the end of the open day's note through the
editor adapter's existing insertion path, so the normal draft-and-save flow
writes it. The app writes only on this user action. Opening a day still creates
nothing.

**D8: The badge is the only notification.** After a scan and when the open day
changes, the app sets `navigator.setAppBadge(count)` to the pending count when
the API exists, and clears it at zero. No permission prompt, no OS notification
in this change.

**D9: A new ADR records the rule.** Reminders are derived from app-owned rules
and never materialized; the app writes a journal line only on user action. This
extends ADR-0015 (which covers `.folio/` but not the derive-never-write rule).

**D10: Removing a reminder removes its rule, not its record.** A rule-backed
row's menu holds "Remove reminder"; it rewrites `.folio/reminders.md` without
that line through `upsertReminders`, leaving the file (header-only when empty,
the pins precedent) because `VaultStorage` has no delete (ADR-0030). The
reminder page and every written journal line stay: the lines are the user's
record and the page's backlinks (ADR-0031). A row that is only a written
reference has no rule and offers no menu. Alternative: delete the file when the
last rule goes. Rejected because the storage layer has no delete and an empty
meta file is what pins already leave.

## Risks / Trade-offs

- **Noise:** without a per-occurrence completion beyond the written line, a
  daily rule is a standing item. Accepted; the line is the opt-out and the badge
  is the only nudge.
- **Rule file drift:** a hand-edited rule can name a page that does not exist.
  Mitigation: the reference is valid and creates nothing (ADR-0012), and the row
  renders like any unmaterialized page row.
- **Parse ambiguity:** a page whose name looks like `daily` or a date. Mitigation:
  the rule line has a fixed three-field shape and the reference is the last
  token, parsed by the existing scanner; a malformed line is ignored, like a
  malformed pin.
- **Surface choice could move:** if the panel proves wrong, the section moves and
  only the workspace delta changes. The derivation and storage do not.
