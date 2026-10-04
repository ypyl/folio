# Tasks

Note: `AGENTS.md` bumps `version` in `package.json` on every commit — a patch
bump for this change, since it refines the compact shell rather than adding a
capability.

Browser checks start a dev server with `npm run dev:test` (an OS-picked port the
log names), confirm the log says `ready in`, and sweep leftovers with
`npm run kill:dev`. A check that ran against a stale server is not evidence.

## 1. The glyph carries the state

- [x] 1.1 Draw the pane filled while a control's view is open: `PanelsIcon`
  takes the open flag, derives the pane from the same `side` that places the
  divider, and draws that rectangle with `fill="currentColor"` and no stroke
  when open, and with no fill when closed. Verify with tests that the open
  control's pane is filled and the closed control's is not, for both controls,
  and that the pane sits on the correct side of the divider.
- [x] 1.2 Give the open control the recede tint as its background, keyed to
  `aria-pressed` rather than to a pointer state. Verify in a real browser,
  where the stylesheet applies: the open control's computed background is the
  tint, the closed one's is transparent, and hovering a closed control does not
  tint it. jsdom applies no stylesheets, so a unit test cannot hold this.
- [x] 1.3 Assert the drawing and the report agree: one test that reads each
  control's drawn state and its `aria-pressed` together, so the visible channel
  cannot drift from the accessible one.

## 2. The rule is written down

- [x] 2.1 Add one sentence to `DESIGN.md`'s touch-target and safe-area section
  saying the compact app bar marks the open view by shape first and tint second,
  and that a control added to that bar follows the same pair. Verify the section
  still reads as rules rather than as a description of one component.

## 3. Verification

- [x] 3.1 Run `npx oxlint --fix`, then `npm run fmt`, then
  `npx oxlint --deny-warnings --format=agent`, and confirm all three are clean.
- [x] 3.2 Run the full test suite and `npm run build`, and confirm the coverage
  thresholds and every existing `workspace` scenario still hold.
- [x] 3.3 Confirm in a real browser at a phone viewport that the open control's
  pane is filled and its background tinted, that the closed control is neither,
  and that the wide composition at 1280px still renders no view control at all.
- [x] 3.4 Confirm on the Pixel 9a over `adb reverse`: screenshot the bar with
  each view open, and check that the filled pane is legible at the drawn size
  and that no control's target or the bar's safe-area padding changed.
