# Design

## Context

See proposal.md — Why. The three controls already exist with their props and
their compact sizing; what changes is who owns the row they sit in.
`Accordion` renders `<summary>` with the title text and a CSS-generated
disclosure marker, so a control placed in the summary has to share the row with
both without changing the row's height and without inheriting the section's
toggle.

## Goals / Non-Goals

**Goals:**

- The summary row carries the three controls in one line, at every width.
- The row stays the same height as the Files summary on a wide window.
- A control click does exactly that control's action.

**Non-Goals:**

- Reworking `Accordion` into a header/body component, or replacing
  `<details>`/`<summary>`.
- Changing what the controls do.

## Decisions

### D1. `Accordion` gains an `actions` slot rendered inside the summary

The slot renders after the title, before the disclosure marker, and the title
becomes a flex item that takes the leftover width, so the actions and the marker
sit together at the trailing edge.

- **Why the summary and not a header band above it?** The request is that the
  controls belong to the accordion item. Any band above the summary is the
  arrangement that was just rejected, and any band below it costs a row of
  panel height.
- **Why not absolutely position the controls over the summary?** The row's
  height, the marker's slot, and the hit targets would all have to be
  coordinated by eye; a flex child is the same result with no magic numbers.

### D2. The actions wrapper cancels the summary's default toggle

`<summary>` activates the section on click, including clicks on its children.
The wrapper calls `preventDefault()` on the click, which cancels that default
action, so each control's own handler runs and the section does not toggle. The
controls keep plain `onClick` handlers: nothing about them knows it is inside a
summary.

- **Why not `stopPropagation`?** The toggle is the click's default action on the
  summary, not a listener, so stopping propagation would not stop it.
- **Why not move the label into a button and drop `<summary>`?** That replaces
  the native disclosure the spec relies on (open/close without JavaScript) to
  solve a problem this wrapper solves in one line.

### D3. The controls are small in the row and touch-sized on a phone

On a wide window they are 20px squares with 14px glyphs and an 11px Today label,
in the summary's own stone; the actions wrapper's negative block margin keeps the
row at the label's height, and the controls overflow into the summary's padding
rather than growing it. At the compact breakpoint they grow to the 44 by 44 touch
target, the wrapper's margins keep the row from ballooning past that, and the
glyphs grow to 20px with the app bar's view icons.

### D4. Copy follows

The tour's sidebar step names the Journal row's controls alongside the calendar
and the listing; the demo guide, `DESIGN.md`, and ADR-0005 say the controls are
on the Journal row.

## Risks / Trade-offs

- **Nested buttons inside a `<summary>`** → Chromium exposes them as buttons and
  keeps the marker's behavior for label clicks; a browser check and the jsdom
  tests both assert the three are reachable by name and that activating one does
  not toggle the section. A page-size browser check confirmed the group is
  exposed in the accessibility tree.
- **The summary is the only place these controls exist** → a collapsed Journal
  still shows them, because they are on the summary, not in the body.
- **The label loses room on a narrow sidebar** → the title ellipsizes first; the
  three controls keep their targets.
