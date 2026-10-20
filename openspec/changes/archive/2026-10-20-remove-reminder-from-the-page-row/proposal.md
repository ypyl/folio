# Proposal

## Why

A reminder can only be removed from the Journal calendar's day menu, which acts
on the currently open page. To clear a reminder you must first find and open the
page it belongs to, and the day you right-click is irrelevant to the removal. The
page's own row menu already carries the page's other actions, so removal belongs
next to them.

## What Changes

- **A page row's menu offers `Remove reminder`.** The item appears after
  `Favorite`/`Unfavorite`, before `Present`, only when the row's page has a
  reminder rule and only while the reminders feature is enabled. Activating it
  deletes that page's rule, the same write the day menu's item makes. The item
  acts on the row's page, whether or not that page is open.
- **The row menu is no longer a fixed pair of items.** It holds the favorite
  item, `Remove reminder` when the page has a rule, and `Present`.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `favorites`: the page row menu's item list admits a conditional
  `Remove reminder` item, so the menu is no longer described as exactly two
  items.
- `reminders`: a page's reminder can be removed from that page's row menu, under
  the same flag gate as the rest of the feature.

## Non-goals

- No way to *set* a reminder from a row menu; a recurrence still needs a day, so
  setting stays in the calendar's day menu.
- No change to the day menu's items, its heading, or its past-day rule.
- No change to the rule file's format, the matcher, materialization, or the
  badge.
- No removal of the day menu's `Remove reminder`; the row menu is a second route
  to the same write.
- No confirmation dialog and no undo: removal is one item activation, as it
  already is in the day menu.

## Impact

- `src/components/Sidebar.tsx`: the page row menu gains a conditional item; the
  sidebar receives which page rows have a rule and a removal callback.
- `src/App.tsx`: derives the set of pages with a rule (memoized on `reminders`)
  and a removal handler that resolves the clicked row's page name to its rule.
- `src/rows.ts` / `src/vault/*`: unchanged; the rule store already supports
  removal by page name.
- Tests: Sidebar and App reminder tests gain the row-menu cases.
- Version bump: a minor bump (a new user-facing capability).
