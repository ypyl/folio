# Design

## Context

See proposal.md — Why. The relevant current state:

- `StatusBar` owns the session navigation: a leading `.nav` group holding two
  chevron buttons and a labelled Today button, plus the compact app bar's
  pointer-sized treatment of them.
- `Sidebar` is two bands (Journal, Files) rendered by `Accordion`, memoized so a
  keystroke in the editor does not rebuild its rows. It already receives
  `todayTick` and owns the calendar it re-anchors.
- `App` owns the handlers (`handleBack`, `handleForward`, `handleToday`) and the
  trail's availability flags, and passes them to `StatusBar` today.
- The compact shell shows one of three full-size layers; the sidebar lives in
  `.layer-nav`, which is `display: none` in every other view, so a control in the
  sidebar is out of the tab order and the accessibility tree whenever the
  navigation view is not the one shown.

## Goals / Non-Goals

**Goals:**

- One home for the three controls, in every composition: the sidebar's
  navigation row.
- Zero new state, zero new handler, zero new chord — the same three controls
  with the same names, order, availability, and behavior.
- No cost on the typing path.

**Non-Goals:**

- Restyling the sidebar's sections, the status bar, or the compact app bar beyond
  deleting what moved.
- Any change to the trail, to Today's semantics, or to the calendar's month
  anchoring and focus behavior.
- A settings surface, a second breakpoint, or a new ADR.

## Decisions

### D1. The row is a sidebar band between the two sections, not a Journal body

The row is a direct child of the sidebar, placed after the Journal `Accordion`
and before the Files `Accordion`. It is a fixed band (`flex: 0 0 auto`) like the
Journal section, so the Files section keeps its own share of the height.

- **Why not inside the Journal body, under the calendar?** Collapsing Journal
  would take Back, Forward, and Today with it. Back and Forward are session
  navigation: a reader who has nothing to do with journals still needs them, and
  a collapsed calendar must not cost them.
- **Why not above the Journal section (restoring the old control row)?** The
  request is the row under the Journal section, and the calendar's own month
  controls sit at the top of the band; putting the trail controls directly under
  the calendar keeps day and session navigation together at the panel's top.
- The row is unlabelled: the three controls name themselves, as they did in the
  bar. No heading, no divider of its own — the accordion summaries already frame
  the bands.

The sidebar's `ResizeObserver` already watches the aside's children, so the new
band needs no measurement code of its own.

### D2. The sidebar receives the handlers; `App` keeps the Today tick

`Sidebar` gains the six props the bar had (`canBack`, `canForward`, `onBack`,
`onForward`, `canToday`, `onToday`) and keeps `todayTick`. `App` passes its
existing callbacks unchanged and drops them from `StatusBar`.

- **Why keep `todayTick` in `App`?** Today's action is an ordinary navigation
  owned by `App`, and the tick is the calendar's re-anchor signal. Keeping the
  counter beside the handler keeps one owner and one ordering: activating Today
  bumps the tick and opens the day, and the calendar re-anchors whether or not
  the day was already open.
- **Why passing handlers into the memoized sidebar is safe:** all three are
  `useCallback` with stable identities and the rest are primitives, so
  `memo(Sidebar)` still bails on every render a keystroke causes. The row itself
  renders nothing per keystroke.

### D3. The status bar loses the group; the compact app bar keeps its two controls

`StatusBar` drops the `.nav` group, `ChevronIcon`, and the `.control`,
`.controlLabel`, and `.controlIcon` styles, plus the compact sizing of them. Its
leading edge becomes the open item's name (compact) or nothing before the path
crumb (wide); at the compact breakpoint the Navigation view control leads.

- **Why not keep the controls in the compact bar as well?** Two renderings of one
  behavior are two things to keep in agreement, and the spec would have to say
  which one wins when both are visible on screen. The navigation view is the
  left panel in the compact composition, so it is the row's home there too.
- **Consequence, accepted:** on a phone the trail costs one extra tap — the
  Navigation view control, then Back. That is the trade the request takes: one
  place for the three controls.

### D4. Touch sizing comes from the existing breakpoint, in the sidebar's stylesheet

At the compact breakpoint the row's controls grow to a 44 by 44 target, in a
`@media (max-width: 640px)` block in `Sidebar.module.css` mirroring the shell's.
`compact.test.ts` already fails on any width query that does not use the shell's
breakpoint, so the declaration cannot drift.

- The row keeps its wide layout (three controls in one line, left-aligned) at
  every width; only the targets grow.
- Safe-area insets need no work here: the shell pads itself, and the sidebar sits
  inside that padding.

### D5. Tour copy follows the move

The sidebar step gains a sentence naming Back, Forward, and Today; the status
step drops them and describes what the bar still holds (the open item, the save
state, the folder and its count). No step is added or removed, so the tour's
length and order are unchanged.

### D6. Documentation follows the move

- `DESIGN.md`: the touch-target rule names the row instead of the bar's controls;
  the compact app-bar paragraph loses them.
- `adr/0005-keep-ui-small-three-pane-layout.md` is **amended**, not superseded:
  the compact composition it decided (one view at a time, no drawer, the bar as
  the app bar) is unchanged, and only its sentence naming the bar as the holder
  of Back, Forward, and Today changes. ADR statuses are edited in place by this
  repo's convention; no new ADR is warranted for a move.

## Risks / Trade-offs

- **The Files section loses a band's height** → the row is fixed and small
  (~30px wide, the controls' own 24px plus the sidebar's padding), and the
  sidebar's fallback scroll still covers a short window.
- **A phone user pays one tap for Back** → accepted in D3; the compact bar stays
  at one non-scrolling row, which is what keeps it from wrapping.
- **A `display: none` sidebar on compact hides the controls from the a11y tree**
  → correct: the navigation view is where they live, and a control that is not on
  screen must not be in the tab order. End-to-end coverage checks them in the
  navigation view instead of the bar.
- **Stale comments and tests that assert the bar's inventory** → the change
  updates `StatusBar.test.tsx`, `Sidebar.integration.test.tsx`,
  `App.integration.test.tsx`, and `tests/e2e/compact-shell.spec.ts` in the same
  commit, so nothing is left asserting the old placement.
