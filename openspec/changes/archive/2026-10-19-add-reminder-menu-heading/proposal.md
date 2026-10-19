# Proposal

## Why

The Journal day menu's items are all reminders, but nothing in the menu says so.
The recurrence labels read like generic actions, and the menu looks the same kind
of surface as a page row's Favorite/Present menu. A small header names the group
and makes the menu read as "reminders for this page".

## What Changes

- **The row context menu can carry a heading.** An optional, non-interactive
  heading is rendered above the items and names the group for assistive
  technology.
- **The day menu uses it.** Its items appear under a `Reminder` heading. The page
  row menu (Favorite/Present) is unchanged.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `reminders`: the calendar day menu's reminder items appear under a `Reminder`
  heading.

## Non-goals

- No heading on the page-row menu.
- No change to the items, their order, the keyboard model, or the anchor.
- No new menu framework.

## Impact

- `src/components/RowContextMenu.tsx` and its CSS: an optional heading.
- `src/components/Sidebar.tsx`: the day menu passes `Reminder`.
- Version bump: a patch bump.
