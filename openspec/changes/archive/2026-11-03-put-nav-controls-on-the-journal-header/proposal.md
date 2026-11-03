# Proposal

## Why

Back, Forward, and Today are the app's session controls, and the sidebar's first
row already says which section is in charge of time. Hanging the three controls
on the Journal section's own header puts them where the eye lands first, at no
cost in panel height: no extra band, no gap, and they stay put when the calendar
collapses.

## What Changes

- Move Back, Forward, and Today from a separate navigation band onto the
  **Journal section's summary row**, at its trailing edge ahead of the
  disclosure marker, in that order.
- The sidebar becomes two sections again (Journal, then Files) with no band
  between them; the Journal summary stays one row tall.
- Activating one of the three controls acts on the session trail or opens the
  current day; it does not open or close the section it rides on.
- Behavior is unchanged: the same names, order, disabled rules, Today's
  open-and-materialize, the calendar re-anchor, and the `Mod+[` / `Mod+]` chords.
- Copy follows: the app tour's sidebar step, the demo guide's Today
  instructions, `DESIGN.md`, and ADR-0005.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `workspace`: the sidebar requirement returns to two sections; a new requirement
  places the session navigation on the Journal summary row and fixes that a
  control does not toggle its section; the Journal calendar, status bar, compact
  touch-target, and app-tour requirements point at the summary row instead of a
  navigation band.

## Impact

- `src/components/Accordion.tsx` + `Accordion.module.css` — an `actions` slot in
  the summary, and the row that keeps its height while holding controls.
- `src/components/Sidebar.tsx` + `Sidebar.module.css` — the controls move into
  the Journal accordion's `actions`; the standalone band and its styles go.
- `src/App.tsx` — no wiring change.
- Copy: `src/tour/steps.ts`, the demo guide's Today instructions, `DESIGN.md`,
  `adr/0005-keep-ui-small-three-pane-layout.md`.
- Tests: `Sidebar.integration.test.tsx` (the controls are on the Journal summary
  and do not toggle it) and `tests/e2e/compact-shell.spec.ts` (the same, in a
  browser, plus the 44 by 44 targets in the navigation view).
- No keystroke-path cost and no `VaultStorage`, index, editor, or search changes.

## Non-goals

- No change to the controls' behavior, names, order, or chords.
- No change to the calendar, its month controls, or the Files listing.
- No new control, setting, or ADR.
