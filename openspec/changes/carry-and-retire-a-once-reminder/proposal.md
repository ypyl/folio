# Proposal

## Why

A `once` reminder has exactly one day, and the app writes its occurrence only
when that day is opened (ADR-0032). A day the user never opened therefore loses
the reminder silently: no line, no badge, no mention anywhere, and once the day
has passed the rule can never match again. The same rule keeps its marker in the
Files listing forever, so a spent one-off is indistinguishable from a live one
and can only be cleaned up by hand from the page's row menu.

## What Changes

- **A missed one-off is carried to today.** A `once` rule whose anchor day has
  passed and that no journal day on or after the anchor records is due on
  today's journal: opening today writes its task item like any due reminder, and
  the badge counts it. It stops being carried as soon as a journal day
  referencing the page exists, so the occurrence lands once.
- **A one-off is retired when it is ticked.** A `once` rule whose page the open
  day's note records as done, on or after its anchor day, is dropped from
  `.folio/reminders.md`, so a finished one-off leaves no marker on its page row.
  The journal line and the page's backlinks stay, as they do for a removed rule.
- **A yearly rule does not fire before its anchor.** `yearly` is the one
  recurrence that compares month-day only, so a rule anchored in the future
  matches an earlier year's same month-day. It gains the same `from the anchor
  day on` guard the other three recurrences already have, which is what the
  spec's `later April 12` wording already says.
- **Nothing else changes.** The rule file's shape, the day menu, the replacement
  confirmation, and the removal paths are untouched. A recurring rule is never
  carried or retired: it still matches its own days and lives until removed.

## Non-goals

- No overdue list, backlog, count, or "missed" surface: a carried one-off is an
  ordinary line in today's note, and there is still no reminder panel (ADR-0032).
- No rollover of recurring rules: a `daily` rule that was not ticked yesterday
  does not accumulate — each day gets its own occurrence, as today.
- No per-occurrence state, no completion history, no scheduler, no notification
  beyond the on-open line and the app-icon badge (ADR-0031).
- No new line syntax: a carried occurrence is written in the same
  `- [ ] <reference>` form as any other.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `reminders`: a `once` rule that missed its day is still due on today, a spent
  one-off is retired from the rule file when it is recorded done, and a `yearly`
  rule does not match before its anchor.

## Impact

- `src/vault/reminders.ts` (the yearly guard; a due-day helper).
- `src/rows.ts` (`unreferencedRules` decides a day's materialization from the
  same due-day rule) and `src/App.tsx` (the badge, the day-open write, and the
  retirement effect).
- `src/components/Sidebar.tsx` is unchanged: the row marker and the removal item
  read the rules, which the retirement keeps truthful.
- Tests: `src/vault/reminders.test.ts`, `src/rows.test.ts`, and
  `src/App.integration.test.tsx`.
- ADR-0032 is amended in place: the day-open write now also materializes a
  missed one-off, and a tick retires a `once` rule.
