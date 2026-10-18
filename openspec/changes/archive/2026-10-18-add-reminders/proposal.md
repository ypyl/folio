# Proposal

## Why

Folio can link a note to a date (ADR-0019) but it cannot remind you about it.
Opening a day shows what already points at it, and nothing else: a birthday
buried in a person's page, or a task tied to a future date, is invisible unless
you remember to look. Users want a recurring nudge, such as a friend's birthday
or a monthly bill, without Folio becoming a task manager or a scheduler.

The problem is delivery, not storage. A local-first PWA with no backend cannot
wake you while it is closed, so a reminder can only mean "show me this when I
open the app on a matching day". This change makes that meaning concrete, using
the concepts the app already has: pages, references, journal days.

## What Changes

- **A reminder is a page.** The thing you are reminded about (a person, a bill, a
  habit) is an ordinary page. Its own Backlinks become the history of every day
  it was referenced.
- **A schedule is a rule in `.folio/reminders.md`**, the app-owned state
  directory of ADR-0015, written as plain Markdown like the pins file. Each rule
  names a recurrence (`once`, `daily`, `weekly`, `monthly`, `yearly`), an anchor
  date, and the reminder page.
- **Rules are match functions over today,** evaluated when the app is open. An
  occurrence is derived, never written while you browse: opening a day still
  creates nothing.
- **The open journal day shows its reminders:** the due rules (derived) merged
  with the reference lines the day already contains. Acting on a reminder writes
  one reference line into that day's note. That line is both the record and the
  backlink that fills the reminder page's history.
- **A reminder can be removed.** Removing it deletes its rule from
  `.folio/reminders.md`; the reminder page and the journal lines it already
  wrote stay, because those lines are the record, not the schedule. The action
  lives on the reminder row's menu, the way a favorite's does.
- **Setting a reminder gets a UI**, so a rule is not hand-written: the day
  offers a way to add a reminder page with a recurrence, and the reference
  picker can complete a date. The exact shape is settled in design.
- **"Notification" means the on-open list plus an app-icon badge** counting the
  day's due reminders. No service worker, no permission prompt, no scheduler.

## Capabilities

### New Capabilities

- `reminders`: the schedule rules and their storage in `.folio/reminders.md`, the
  per-day derivation, the day's reminder view, the action that writes one
  reference line, and the badge count.

### Modified Capabilities

- `workspace`: the open journal day gains a reminders surface. The sidebar and
  right panel currently hold a fixed set of sections, so where the reminders
  view sits is a shell-level change.

## Non-goals

- No backend, no push, no service-worker scheduling, and no dependable reminder
  while the app is closed. On-open surfacing and the icon badge are the ceiling.
- No materializing rules into journals. The app never writes a reminder line the
  user did not trigger, and opening a day writes nothing.
- No per-occurrence completion state beyond the written reference line, and no
  streak or analytics.
- No block model, no query language, no general recurrence beyond the five
  rules, and no custom RRULE syntax.
- No reminder-specific search kind, and no reminder state in the page index that
  grows with past occurrences.

## Impact

- `src/vault/`: a reminders meta reader alongside `readPins`, and a pure
  due-derivation. Scan-time work, memoized per graph, never on the keystroke
  path.
- `src/rows.ts` and the reminder fold: the day's reminder rows, built like the
  existing backlink and listing rows.
- `src/components/`: the reminders surface on the open journal day and its
  add/edit controls.
- `.folio/reminders.md`: a new app-owned Markdown file, plain and human-readable.
- Version bump: a minor bump, since this is a new user-facing capability.
- **New ADR**: [ADR-0031](../../../adr/0031-reminders-are-derived-from-rules.md)
  records that reminders are derived from app-owned rules, are never
  materialized into user prose, and that the app writes a journal line only on
  user action. ADR-0015 covers `.folio/` but not the derive-never-write rule.
