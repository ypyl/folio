# Design

## Context

See proposal.md — Why. `Accordion` renders one `<summary>` holding a `.title`
span, an optional `.actions` group, and a CSS-drawn chevron: a `::after`
pseudo-element made of two borders, rotated -45° while collapsed and 45° while
open.

## Goals / Non-Goals

**Goals:**

- The chevron is the row's first visible item, at every accordion.
- The label follows it, and the trailing edge stays with the row's controls.

**Non-Goals:**

- Replacing the CSS pseudo-element with an element or an icon.
- Changing the glyph, colour, size, or transition.

## Decisions

### D1. The marker becomes `::before`

A `::before` pseudo-element is the summary's first flex item, ahead of the title
span, so one rule moves the marker for every accordion and nothing in the markup
changes. The rotation rules swap their selector target (`::after` → `::before`)
and the transform values stay as they are, so collapsed still points right and
open still points down.

- **Why not an element rendered by `Accordion`?** It would be an extra DOM node
  that means nothing to assistive technology, duplicates a decoration the
  stylesheet already owns, and every summary in the app would carry it.
- **Why does the marker not become its own control?** The summary row is the
  disclosure control (native `<details>`/`<summary>`); a second clickable marker
  would give the row two controls with the same action.

### D2. The leading slot is sized by the marker and the row's gap

The marker keeps its 7 by 7 box inside the summary's existing 8px gap, so labels
start one marker-width and one gap in from the padding edge and stay aligned
across sections. The row's height is untouched: the marker is shorter than the
label and the row's controls.

## Risks / Trade-offs

- **Labels shift right by the marker slot** → every summary shifts by the same
  amount, so the sections stay aligned with each other; the Files listing rows
  already sit at a 4px inset and read as the body under the summary.
- **The right panel's sections share the change** → intended: one marker rule for
  every accordion, so the two panes cannot drift apart.
