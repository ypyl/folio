# Proposal

## Why

The calendar day menu's reminder items act on the open page. When the open item
is a journal day, that page is a date, so the reminder's target becomes a date:
the app would remind you about a day, which means nothing. A reminder is about a
page you want to be reminded about (a person, a bill, a habit), not about the day
you happen to be looking at.

## What Changes

- **Reminder items are offered only for a regular page.** The Journal calendar's
  day menu shows `Once, on this day`, the four recurrences, and `Remove reminder`
  only when the open page is a page, not a journal day. With a journal day open
  (or a board, or nothing), the day menu offers no reminder items.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `reminders`: the day menu's reminder items require the open page to be a page,
  not a journal day.

## Non-goals

- No change to how a rule matches, materializes, or is removed.
- No change to the reminder items' labels or their anchor.
- No reminder about a journal day; a day is not a target.

## Impact

- `src/App.tsx`: the reminder target is computed only for a page-kind open item.
- Tests: the App integration and Sidebar tests gain the journal-day case.
- Version bump: a patch bump.
