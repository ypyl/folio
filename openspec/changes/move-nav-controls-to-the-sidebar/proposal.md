# Proposal

## Why

Back, Forward, and Today are session-level navigation, but they sit at the
status bar's leading edge, a thin metadata row at the bottom of the window, far
from the surface that answers "where am I and where can I go" — the Journal
calendar in the sidebar. Putting them directly under the Journal section keeps
them in the sidebar's top band, which is always visible and always in reach,
and gives the status bar back the job it does best: reporting state.

## What Changes

- Move **Back**, **Forward**, and **Today** out of the status bar and into the
  sidebar, as one navigation row directly **below** the Journal section and
  above the Files section. The row is a band of the sidebar, not part of the
  Journal accordion's body, so collapsing Journal leaves the controls in reach.
- The status bar loses the three controls and its leading navigation group; it
  now leads with the open item's name and keeps its status text, the folder
  statistics, the version, and — at or below the compact breakpoint — its two
  view controls.
- Behavior is unchanged: Back and Forward still step the session trail and are
  unavailable at its ends; Today still opens the current day's journal, creates
  nothing on open, is disabled while no folder is usable, and still re-anchors
  the Journal calendar to the current month.
- The controls follow the shell into its compact composition: at or below the
  compact breakpoint the navigation view is the left panel, so that is where
  they live, and they grow to the 44 by 44 touch target the app bar's controls
  meet. The compact app bar no longer carries them.
- The app tour's copy follows: the sidebar step teaches the trail controls and
  Today, and the status step describes only what the bar still holds.
- **BREAKING for anyone with muscle memory or automation keyed to the bar:** the
  three controls change surface. Their accessible names, order, disabled rules,
  and keyboard chords (`Mod+[` / `Mod+]`) are unchanged.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `workspace`: the sidebar requirement gains the navigation row between the
  Journal and Files sections; the status bar requirement loses the three
  controls and their leading group; the Journal calendar requirement points at
  the sidebar row for Today; the compact touch-target requirement covers the
  moved controls in the navigation view instead of the app bar; the app tour
  requirement's sidebar step now covers the navigation controls.
- `history`: the keyboard-trail requirement names the Back and Forward controls
  without naming the surface that holds them.

## Impact

- `src/components/StatusBar.tsx` + `StatusBar.module.css` — remove the
  navigation group, its chevron glyph, and the controls' styles.
- `src/components/Sidebar.tsx` + `Sidebar.module.css` — add the navigation row
  below the Journal section, with the three controls and their styles.
- `src/App.tsx` — pass the navigation props and the Today tick to `Sidebar`
  instead of `StatusBar`; nothing else in the app's state changes.
- `src/tour/steps.ts` — the sidebar and status step copy.
- `DESIGN.md` — the touch-target rule and the compact app-bar description.
- `adr/0005-keep-ui-small-three-pane-layout.md` — the compact composition's
  paragraph names the bar as the holder of the three controls; it is amended,
  not superseded, since the composition itself does not change.
- Tests: `StatusBar.test.tsx` (navigation cases move out),
  `Sidebar.integration.test.tsx` (the row is now present, and the Today tick
  still re-anchors the calendar), `App.integration.test.tsx` (role-based lookups
  still resolve, plus a compact case), and `tests/e2e/compact-shell.spec.ts` (the
  bar's control inventory shrinks; the navigation view's controls meet 44 by 44).
- No `VaultStorage`, index, editor, or search changes. No keystroke-path cost:
  the row holds three `useCallback` handlers and primitives, so the memoized
  sidebar still skips re-rendering while typing.

## Non-goals

- No change to trail semantics, the trail's capacity, Back/Forward
  availability, or Today's open-and-materialize behavior.
- No rename: the controls stay named Back, Forward, and Today.
- No new control, menu item, chord, or setting — the row holds exactly what it
  held before, in the same order.
- No change to the Journal calendar's own previous/next month controls, its
  month anchoring, or the open-day focus behavior.
- No change to the compact composition: still one view at a time, still no
  drawer, still the same breakpoint.
- No new ADR.
