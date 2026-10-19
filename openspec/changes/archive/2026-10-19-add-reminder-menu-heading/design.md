# Design

## Context

See proposal.md. `RowContextMenu` renders a `role="menu"` with a flat list of
menuitem buttons. The day menu and the page-row menu share it. Arrow keys move
over the menu's buttons, so a non-button heading does not enter the keyboard
model.

## Decisions

**D1: An optional `heading` prop, rendered as a labelled group.** The heading is
a visible, non-focusable line above the items, and the items are wrapped in a
`role="group"` named by it, so assistive technology hears the group as
"Reminder" rather than an unlabelled list. The visible text is `aria-hidden`
because the group's name already carries it. The page-row menu passes no heading,
so it is unchanged.

Alternative considered: a `role="presentation"` divider. Rejected because the
menu would lose the group's name.

**D2: The day menu passes `Reminder`, singular.** The menu acts on one page and
one day, so the header names the kind of action, not a list of reminders.

## Risks / Trade-offs

- **A heading adds height.** Short, one line, above the items; it does not change
  the menu's flow or its viewport clamp.
