# Proposal

## Why

The calendar day menu is where a reminder is *chosen*. It also carries a
`Remove reminder` item, so the same small menu both sets and deletes a schedule,
and the destructive item sits at the bottom of a list the user opened to pick a
recurrence. Removal belongs to the page's own row menu, next to Favorite, where
the page's other actions live.

Its other gap is silent loss: choosing a recurrence for a page that already has
one overwrites the old schedule without a word, so the anchor and recurrence the
user had are gone with one click.

## What Changes

- **The day menu no longer offers `Remove reminder`.** Its items are the five
  recurrences, under the `Reminder` heading. Removal stays on the page's row menu.
- **Choosing a recurrence for a page that already has a rule asks first.** A
  confirmation names the page, the schedule that would be replaced, and the one
  being chosen; only *Replace* writes. *Cancel* or `Escape` writes nothing, so the
  existing rule stays. Choosing a recurrence for a page with no rule still writes
  immediately, with nothing to confirm.
- **`Remove reminder` on the page row keeps one activation.** It is out of scope
  here: the removal it performs is already outside the day menu, and adding a
  second confirmation is a separate question.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `reminders`: the calendar day menu's item list loses `Remove reminder` and
  gains a confirmation before a replacement; the removal requirement loses its
  day-menu route, which leaves the page row menu as its only surface.

## Non-goals

- No confirmation for `Remove reminder` on the page row menu, and no change to
  what removal keeps (the page and every journal line already written stay).
- No change to the recurrences, the matcher, materialization, the badge, or the
  feature flag.
- No undo, and no "keep both" option: a page has one rule, so the choice is
  replace or cancel.
- No change to the row menu's item order or to the day menu's past-day rule.

## Impact

- `src/components/Sidebar.tsx`: the day menu loses its `Remove reminder` item and
  the `hasReminder`/`onRemoveReminder` props it alone used; the menu labels come
  from one recurrence map shared with the confirmation.
- `src/components/ConfirmReminderReplace.tsx` (new): a small `<dialog>`
  confirmation, the same modal pattern the search spotlight uses.
- `src/App.tsx`: a pending reminder choice gates `handleRemind` through the
  dialog; `handleRemoveReminder` goes away, leaving the row route.
- Tests: Sidebar day-menu tests drop the removal cases; App tests cover the
  confirmation (written only on Replace, nothing on Cancel/Escape) and the
  immediate write when no rule exists.
- README: the day menu sets reminders only; removal is on the page's row menu;
  replacing asks first.
- Version bump: a minor bump (a new confirmation step in the reminder flow).
