# Design

## Context

See proposal.md - Why. The pieces that shape the approach:

- The row menu is `RowContextMenu` inside `Sidebar`; its items are built where the
  sidebar renders it, from `menu.path` (the row the menu belongs to, which may
  not be the open page).
- The day menu's removal already exists in App: `handleRemoveReminder` filters
  `reminders` by the open page's title, case-insensitively, and writes the rest
  through `saveReminders`.
- `remindersEnabled` already reaches `Sidebar` and gates the day menu, so the
  flag contract needs no new plumbing.
- Page rows carry `label` = the page's title, the same name a rule's target
  holds (`sidebarListing`).

## Goals / Non-Goals

**Goals:**

- One conditional menu item, from one match rule, removed by one write path
  shared with the day menu.
- No new work on the typing path and no per-row scan per render.

**Non-Goals:**

- No setting a reminder from a row menu; anchoring needs a day.
- No confirmation, undo, or new write format.

## Decisions

### D1: The sidebar receives a memoized set of pages that have a rule

App derives `reminderTargets: ReadonlySet<string>` (lowercased rule targets) with
`useMemo` on `reminders` and passes it to `Sidebar`. The row menu asks
`reminderTargets.has(row.label.toLowerCase())`.

Alternatives: passing `reminders` and filtering per row is O(rows × rules) on
every sidebar render; a `Set` is O(1) per row and its identity changes only when
the rules do, so Sidebar's `memo` still holds. The lowercased title comparison is
the one the day menu's `hasReminder` already uses, so the two routes agree on
which pages have a rule.

### D2: The item calls a path-based callback, like the row's other actions

`Sidebar` gains `onRemoveReminderFor?: (path: string) => void`, called with the
menu's row path, not the page name. Every other row action (`onFavorite`,
`onPresent`, `onOpenAsset`) takes the row's path, and App already owns the
path-to-title resolution that `reminderTarget` performs. Passing a name would put
that resolution in the sidebar and leave two ways to identify a page.

### D3: One removal helper behind both routes

App gets `handleRemoveReminderFor(path)`; both it and `handleRemoveReminder`
(day menu, open page) call one `removeReminderFor(target)` that filters the rules
by lowercased target and saves. The row route resolves the title from
`graph.pages.get(path)?.title ?? stem(path)`, exactly as `reminderTarget` does,
so a page with no file yet - which can hold a rule - removes correctly too.

### D4: No heading and no grouping in the row menu

The item sits after the favorite item and before `Present`, ungrouped. The day
menu's `Reminder` heading exists because its five items are one group; a second
heading around a single item would add weight without adding meaning. Covered by
the favorites delta: the menu's order is favorite, reminder, present.

### D5: The flag gates the item, not just the write

The item renders only while `remindersEnabled` is on. The disabled build keeps
the two-item menu it has today, and no path can delete a rule the feature does
not surface. The rule file, parser, and matcher stay regardless, as the flag
requirement already says.

## Risks / Trade-offs

- [A hand-edited file with two rules that differ only in case would lose both] →
  The day menu already behaves this way, and "a page has at most one rule" is the
  rule requirement; leaving the two routes consistent is worth more than
  defending against a file the app never writes.
- [The menu's item count now varies] → The existing menu already varies (the
  favorite label flips, `Present` is compiled out), and the order is stated in
  the favorites spec.
- [Sidebar re-renders when rules change] → Once per rule write, from a memo with
  `reminders` as its only input; nothing on the typing path.
