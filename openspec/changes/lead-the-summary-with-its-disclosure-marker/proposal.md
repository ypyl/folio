# Proposal

## Why

Every accordion summary draws its disclosure marker at the trailing edge, where
it reads as furniture at the end of the row and sits beside whatever controls
the row holds. Leading with the marker puts the affordance where a disclosure
list is read — before the label, the way a tree or an outliner draws it — and
gives the row's trailing edge to the section's own controls.

## What Changes

- Draw the disclosure marker **before the label** in every accordion summary:
  the sidebar's Journal and Files, and the right panel's Contents, Links, and
  shorts reference.
- The marker keeps its meaning (points right while collapsed, down while open),
  its decoration-only role (the summary row stays the one disclosure control),
  and its transition; it does not change the row's height.
- The row's trailing edge is left to the section's own controls, which is where
  the Journal row's Back, Forward, and Today already sit.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `workspace`: a new requirement places the disclosure marker at the summary's
  leading edge ahead of the label; the Journal-summary requirement no longer
  places the session navigation ahead of a trailing marker.

## Impact

- `src/components/Accordion.module.css` — the marker moves from `::after` to
  `::before`, ahead of the title span.
- `DESIGN.md` — the side-pane band paragraph's parenthetical about which bands
  size to content.
- Tests: a browser check in `tests/e2e/navigation.spec.ts` that the marker is
  drawn ahead of the label and the row's controls sit after it.
- No component API change, no keystroke-path cost, no data or vault change.

## Non-goals

- No new accordion behavior: open/close, defaults, band heights, and the
  summary's controls are unchanged.
- No change to the marker's glyph, colour, size, or animation.
- No change to the right panel's sections beyond the marker's side.
