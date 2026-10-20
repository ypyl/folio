# Proposal

## Why

The calendar's day menu refuses to open on any day before today, because a
`once` reminder anchored in the past could never fire. That throws away the
recurrences that do make sense from a past anchor (`daily`, `weekly`, `monthly`,
`yearly` all match from the anchor onward), so a recurring reminder that started
earlier can only be set by anchoring it on today - which changes its schedule.

## What Changes

- **The day menu opens for any calendar day, including a past one.** The two
  conditions it already has stay: the reminders feature is on, and a page is open
  to remind about.
- **`Once, on this day` is shown but unavailable for a day before today.** The
  item stays in place so the menu reads the same every day, and pointing at or
  activating it writes no rule. Every other item - the four recurrences and
  `Remove reminder` - stays available on a past day.
- **The menu's keyboard movement skips an unavailable item**, and opening the
  menu puts focus on the first available item.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `reminders`: the calendar day menu is offered for every day, and only its
  `Once, on this day` item is unavailable for a day before today. This replaces
  the "no reminder items for a past day" rule.

## Non-goals

- No change to the recurrences, the matcher, or materialization: a recurring rule
  anchored in the past still matches from its anchor onward, and opening a past
  journal day still materializes nothing new for a `once` rule.
- No change to the page row menu, whose `Remove reminder` item is unaffected.
- No new confirmation and no warning text about the unavailable item; a disabled
  item is the whole signal.
- No change to the rule file format, the badge, or the feature flag.

## Impact

- `src/components/Sidebar.tsx`: `openDayMenu` drops its past-day guard; the
  `Once, on this day` item is disabled when the clicked day is before today.
- `src/components/RowContextMenu.tsx`: an item can be disabled; a disabled item
  takes no focus and cannot be activated, and the arrow keys/`Home`/`End` step
  over it.
- Tests: Sidebar day-menu tests gain the past-day cases (menu opens, `Once`
  unavailable, other items work, keyboard skips it); the App integration test
  that expects no menu on a past day flips to expect the menu with the disabled
  item.
- README: the reminder section no longer says "today or a later one".
- Version bump: a minor bump (a reusable recurrence can now be anchored on a past
  day).
