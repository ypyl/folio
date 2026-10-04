# Design

## Context

See `proposal.md` — Why. What shapes the approach:

- `StatusBar.tsx` draws each view control's glyph with one `PanelsIcon`, a
  24-unit viewBox frame (`rect` at 3,4 18x16, radius 2) plus one divider line at
  `x=9` for navigation and `x=15` for meta. The frame's left or right of that
  line is therefore already a rectangle — the pane.
- The only state difference today is the CSS colour: `.viewControl` is
  `--stone`, and `.viewControl[aria-pressed='true']` is `--brand`. The shape is
  identical.
- The control already exposes its state to assistive technology through
  `aria-pressed`, and the compact shell's whole surface is gated by
  `useCompact()`, so nothing here reaches a wide viewport.
- `DESIGN.md` registers `--brand-tint` as the recede tier of the app's two chip
  tiers, and its rules forbid a second chromatic colour and reward subtractive
  decoration.

## Goals / Non-Goals

**Goals**

- The open view is readable at a glance on a phone, including in daylight and
  without relying on hue.
- One treatment, applied by both controls, that the next control added to this
  bar can copy.
- No change to the accessible state, the targets, the layout, or anything on an
  interaction path.

**Non-Goals**

- Not a glyph redesign: the frame and the divider stay where they are.
- Not a new icon set, an icon component, or a size/weight system.
- Not a change to the desktop strips' arrows or to their ADR-0005 semantics.
- Not a colour-only signal, and not a second colour.

## Decisions

### D1: The pane fills, by shape, and the tint reinforces it

The pane inside the frame is filled with `currentColor` while the control's view
is open; the frame and divider keep their stroke. The open control also takes
`--brand-tint` as its background.

Alternatives considered:

- **Colour only** (the status quo, and what a tint alone would be). Rejected: it
  is the failure being fixed. Hue alone is invisible to some users and weak in
  sunlight, and the spec now forbids it as the signal.
- **A filled dot or an underline mark.** Rejected: it adds an element to the
  bar rather than describing the control, and it would need its own rule for
  placement and clearance.
- **Swapping the glyph entirely** (a closed-panel icon versus an open-panel
  one). Rejected: two drawings to keep in step, and the pair reads as two
  different controls rather than one control in two states.
- **A chevron that flips direction**, mirroring the desktop strips. Rejected:
  the strips' arrow answers "which way will this go", which is the right
  question for a full-height edge strip and the wrong one for a bar button whose
  job is "which view am I in".

Implementation shape: `PanelsIcon` takes the open flag and draws the pane
rectangle with `fill="currentColor"` and no stroke when open, and with no fill
when closed. The pane's geometry is derived from the same `side` that places the
divider, so the fill and the divider cannot disagree. The background comes from
the existing `aria-pressed` attribute, so the drawing and the accessible state
have one source: the attribute the control already sets.

### D2: The tint is decoration; the fill is the contract

`aria-pressed` remains the state assistive technology reads and the state the
spec's reporting scenario asserts. The tint is a background on an existing
44x44 target and changes no geometry, so it cannot affect layout, targets, or
the safe-area padding. Both the fill and the tint derive from the same
attribute, which is why the design adds no new prop, no new state, and no new
CSS class on the control — only the glyph's fill and one attribute selector.

### D3: The rule is written down where the bar's other rule is

`DESIGN.md`'s "Touch targets and safe areas" section is the compact app bar's
section. One sentence joins it: the open view is marked by shape first and tint
second, and a control added to that bar follows the same pair. Without it the
next icon invents a third treatment, which is the drift the design language
exists to prevent.

## Risks / Trade-offs

- **The fill is invisible at 20px if the pane is too thin.** → The pane is 6
  units of a 24-unit viewBox at the drawn size of 20px, so it renders about 5px
  wide, which is legible; the browser check and the device screenshot confirm it
  rather than assuming it.
- **`currentColor` on a stroked rect double-draws the edge.** → The pane is
  drawn without a stroke while open, so its fill meets the frame's stroke
  cleanly instead of fattening it.
- **The tint could be mistaken for a hover or a focus ring.** → It is keyed to
  `aria-pressed`, not to `:hover` or `:focus-visible`, which keep their own
  separate treatment; the tests assert the attribute-driven background rather
  than a state that a pointer could fake.
- **A second visual channel that the accessible state does not share.** →
  Both derive from `aria-pressed`, and one test asserts the drawn state agrees
  with the reported one, so they cannot drift apart silently.
- **The wide composition.** → The controls render only on compact, so a wide
  viewport has no view control to style; the existing wide e2e case still
  asserts their absence.

## Migration Plan

No data migration and nothing persisted changes. The change is one SVG
attribute, one CSS declaration, one DESIGN.md sentence, and tests; a rollback is
a plain revert. The `workspace` spec's status-bar requirement is updated in
place. Version takes a patch bump, since this refines the compact shell rather
than adding a capability.

## Open Questions

None. The treatment is fixed by the spec delta, and the two choices it left open
(the pane's fill and the tint's tier) are settled in D1.
