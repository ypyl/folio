# Design

## Context

See proposal.md - Why. Constraints that shape the approach:

- `Sidebar.openDayMenu` currently returns early for `date < today`; `today` comes
  from `useToday` in App and already drives the calendar's today marking, so the
  past-day comparison needs no new source of truth.
- `RowContextMenu` renders every item as a `role="menuitem"` button, focuses the
  first button on open, and moves focus with the arrow keys, `Home`, and `End`.
- The day menu is the only menu that will hold a disabled item; the row menu's
  items stay always available.

## Goals / Non-Goals

**Goals:**

- One truth for "is this day past" (the `today` value already passed down), and
  an item that refuses activation through every input path without extra guards
  at each call site.
- No change to the menu's shape or to the write paths.

**Non-Goals:**

- No explanatory copy or tooltip for the disabled item.
- No disabled-item styling beyond the menu's existing look; no new tokens unless
  `DESIGN.md` already defines a disabled treatment for menu items.

## Decisions

### D1: Unavailable means the native `disabled` attribute

`RowMenuItem` gains `disabled?: boolean`, rendered as `disabled` on the menuitem
button. A native disabled button refuses pointer and keyboard activation in the
platform itself, is exposed as unavailable to assistive technology, and needs no
`aria-disabled` plus a click guard kept in sync. The day menu sets
`disabled: date < today` on `Once, on this day` only.

Alternative rejected: `aria-disabled` with a click-time guard, which duplicates
the refusal logic and lets a test pass while the platform still activates the
item.

### D2: The menu's focus sequence skips disabled items

`RowContextMenu` asks for its available buttons (`:not(:disabled)`), focuses the
first of them on open, and computes arrow/`Home`/`End` moves over that same list.
With no available item it focuses the menu container (given `tabIndex={-1}`) so
focus still enters the menu and `Escape` works. This is the only change to the
shared component, and it leaves the row menu's behavior identical because none of
its items are ever disabled.

### D3: The past day keeps the same item list, minus availability

The menu still shows all five recurrences and `Remove reminder`, in the same
order, on a past day. `openDayMenu` drops only its `date < today` guard, so the
spacebar/menu-key invocation, the position clamping, and the dismissal rules are
untouched.

### D4: Nothing else learns about the past day

Materialization runs on the open journal day, not the clicked one, so opening a
past journal day still writes only what its own open already writes. The `once`
rule can no longer be created in the past, so the rule that used to be
unreachable stays unreachable - by construction rather than by a menu guard.

## Risks / Trade-offs

- [A past-day menu offers a recurrence anchored in the past, which a user might
  read as "starting retroactively"] → That is what the matcher already does
  (matching from the anchor onward), the recurrence names are unchanged, and a
  `once` item is the only thing the past made meaningless.
- [A disabled item scrolls past unnoticed on a past day] → The item keeps its
  place, so the menu has one shape; the feature is behind a flag and is not a
  primary path.
- [Focus could be left outside the menu if every item were disabled] → Handled
  by focusing the menu container; today no day menu can have all items disabled,
  so this is a guard, not a used path.
