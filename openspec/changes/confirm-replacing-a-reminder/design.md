# Design

## Context

See proposal.md - Why. Constraints that shape the approach:

- `Sidebar` owns the day menu; its items call `onRemind(date, recurrence)` and the
  only conditional item is `Remove reminder`, gated by `hasReminder`.
- `App.handleRemind` already replaces the page's rule by filtering `reminders` on
  the target and appending the new rule; the write path needs no change.
- Modal surfaces in the app are native `<dialog>` elements opened with
  `showModal()` (search spotlight, presentation), which gives the top layer,
  focus containment, `Escape`, and the backdrop for free. `Tour` is the one
  hand-rolled modal.
- A rule is `{ recurrence, anchor, target }`, so naming it in a confirmation
  needs only the label already used by the menu and a formatted anchor.

## Goals / Non-Goals

**Goals:**

- One place decides whether a choice replaces or writes: App, where the rules
  live.
- A confirmation that names what is lost, and refuses to write on any dismissal.
- No change to the item list's behavior beyond dropping one item.

**Non-Goals:**

- No confirmation for removal, and no change to what removal keeps.
- No recurrence picker of its own; the day menu stays the chooser.

## Decisions

### D1: App holds the pending choice; the dialog is a dumb child

`handleRemind(date, recurrence)` becomes a request: when the open page has a rule,
App stores `{ date, recurrence }` in state and renders the confirmation; when it
does not, it writes immediately. Confirming calls the existing write, cancelling
clears the state. Sidebar keeps only its `onRemind` callback, so the menu stays a
list of choices and the rules stay in one owner.

Alternative rejected: Sidebar renders the dialog and App exposes a
`confirmReplace` variant of the callback. The sidebar would then need the
existing rule's schedule and the dialog would compete with App's own state for
"is a rule set", which is already derived there.

### D2: The confirmation is a native `<dialog>`

`ConfirmReminderReplace` renders `<dialog>` and calls `showModal()` on mount,
following the search spotlight and the presentation view (DESIGN.md's floating
surfaces: `--ivory`, one whisper shadow, the token-derived backdrop). `<dialog>`
supplies the focus containment, the Escape handling (its `cancel` event), and the
backdrop; the component only renders copy and two buttons.

Copy: a title (`Replace reminder?`), a body naming the page, the existing
schedule, and the new one in the menu's own words ("Every day from October 6,
2026"), and two controls, `Cancel` and `Replace`. Focus starts on `Cancel`, so
Enter cannot destroy the existing rule by accident. Written journal lines are not
mentioned; nothing about them changes.

Alternative rejected: `window.confirm`, which blocks the app, cannot be styled,
and reads as a browser, not the app, in an editorial UI.

### D3: One recurrence label map

The menu items' visible labels and the confirmation's copy come from one
`RECURRENCE_LABELS` map (`Once, on this day`, `Every day`, …), so a rewording
cannot leave the confirmation describing a label the menu no longer shows.

### D4: The day menu drops its removal item and its props

With `Remove reminder` gone from the day menu, `Sidebar` no longer needs
`hasReminder` or `onRemoveReminder`; both props and their App wiring go.
`handleRemoveReminder` goes with them, and `removeReminderFor` keeps serving the
row menu, so removal has one route and one implementation.

## Risks / Trade-offs

- [A user replacing a reminder now takes two steps] → The second step only
  appears when a rule exists, and it is the only moment a schedule can be lost
  silently today.
- [A dialog on top of a context menu could leave focus stranded] → The day menu
  closes when an item activates, before the dialog opens, and `<dialog>` returns
  focus to the last focused control when it closes.
- [The confirmation shows a schedule the user may not remember setting] → That is
  the point: it is the reminder the replacement deletes.
