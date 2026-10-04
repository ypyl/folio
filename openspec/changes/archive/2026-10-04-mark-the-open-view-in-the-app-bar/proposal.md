# Proposal

## Why

The compact shell's two view controls differ only by stroke colour — stone while
the view is closed, brand while it is open — and their glyph is identical. On a
phone that is easy to miss in daylight and impossible for anyone who cannot
separate the two hues, so the bar does not actually say which view you are
looking at. The `workspace` spec already asks each control to expose whether its
view is the one shown; today that exposure is the accessible state plus a colour
shift, and the colour shift is doing all the work.

## What Changes

- **Each view control's glyph SHALL carry its state by shape.** The pane inside
  the frame is filled while that control's view is open and empty while it is
  closed, so the state survives without colour. The closed state is otherwise
  unchanged: same frame, same divider, same stone stroke.
- **The control whose view is open SHALL also carry a `--brand-tint`
  background**, an existing registered token, so it reads as the selected
  control and not only as a different drawing.
- **Nothing else about the controls changes.** Same two buttons, same accessible
  names, same `aria-pressed`, same 44px targets, same placement at the bar's two
  ends, and no control at all above the compact breakpoint.
- **`DESIGN.md` gains one sentence beside its touch-target rule** saying the
  compact app bar marks the open view by shape first and tint second, so the next
  control added to that bar follows the rule instead of inventing a third
  treatment.

## Capabilities

### New Capabilities

None. This refines how one existing control draws itself.

### Modified Capabilities

- `workspace`: the compact bar's view controls must **show** which view is open,
  not merely report it, and must do so without depending on colour alone.

## Non-goals

- **No new control, view, or gesture.** The two controls, the three views, the
  landing rule, and the history entry that Back pops all stay exactly as they
  are.
- **No change to the wide composition.** The view controls do not render above
  the compact breakpoint, so nothing about the three-pane shell, its strips, or
  their arrows changes. The desktop strips keep their own established
  arrow-direction language; this is the app bar's, not theirs.
- **No change to the accessible state.** `aria-pressed` and the accessible names
  stay as they are; the fill is a visible reinforcement of what assistive
  technology already reads, not a replacement for it.
- **No change to the touch-target or safe-area rules**, to the bar's compact
  content, or to anything on the keystroke path. Drawing a filled rectangle is a
  static render.
- **Not a redesign of the glyph.** The frame and the divider stay where they are;
  only the pane's fill changes.

## Impact

- **`src/components/StatusBar.tsx`** — the pane glyph gains a fill when the
  control's view is open.
- **`src/components/StatusBar.module.css`** — the open control's background.
- **`src/components/StatusBar.test.tsx`** — cases for the drawn state.
- **`tests/e2e/compact-shell.spec.ts`** — the existing compact spec asserts the
  state where it can; the drawing itself is confirmed in a real browser and on
  the Pixel.
- **`DESIGN.md`** — the one-sentence rule beside the touch-target rule.
- **No dependency, no build change, and no new code on any interaction path.**
