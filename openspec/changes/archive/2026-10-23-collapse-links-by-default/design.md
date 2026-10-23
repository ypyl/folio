# Design

## Context

See proposal.md - Why. The pieces that shape the approach:

- `Accordion` renders `open={defaultOpen}` and React never rewrites the
  attribute across renders, so a reader's toggle survives every re-render; the
  default is a default, not a controlled state.
- `MetaPanel.module.css` gives `.links` `flex: 1 1 0` and `justify-content:
  flex-end` so the open band takes the remaining height and a closed band sits at
  the panel's bottom, with `.panel:has(.links details:not([open])) .footer`
  cancelling the footer's `margin-top: auto` in that case.
- `.contents` is `flex: 0 0 auto` and its body is capped at `40vh`, so with Links
  closed the leftover height had nowhere to go.
- DESIGN.md already states the band rule this change restores: a band is
  `flex: 1 1 0` while open and "exactly its summary row while closed".

## Goals / Non-Goals

**Goals:**

- The panel opens on the page's shape, with Links one click away.
- No empty band: the height a closed Links gives up goes to Contents.

**Non-Goals:**

- No new state, no persisted section state, no change to either section's rows.

## Decisions

### D1: The default flips; nothing else about Links changes

`defaultOpen` leaves the Links section. Every other behaviour - its rows, order,
badges, scroll region, the board's Referenced by band - is untouched, and a
reader who opens Links gets exactly what they had before.

### D2: A closed band is its summary row, so Contents grows

`.links:has(details:not([open]))` stops taking the leftover height, and the panel
gives that height to `.contents` and its body instead of to an empty band above
the collapsed row. This is what the ui-shell spec already requires ("when Links
is collapsed Contents SHALL take the space it gave up"), and it is DESIGN.md's
band rule; the closed case simply had not been implemented because it was not the
default.

Alternative rejected: leave the height empty above the collapsed band. It is the
documented layout for a reader who closes a band, but as the panel's default it
would show a hole instead of the content the change exists to surface.

## Risks / Trade-offs

- [A reader who always opens Links now needs one click per page] → The panel
  keeps no session state by design, and the click is the same one the collapse
  control already offered.
- [Contents can now be taller than its 40vh cap] → Only while Links is closed,
  which is exactly when nothing else claims the height; the body still scrolls
  inside itself, so the panel never grows.
- [The `:has()` selectors in the panel grow] → Chromium-first app, and the panel
  already uses `:has()` for the footer in the same situation.
