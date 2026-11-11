# Design

## Context

See `proposal.md` — Why. What shapes the approach:

- `StatusBar` is one component for both widths today: at wide it shows the path,
  save state, vault stats, and version; at compact it shows the save state and
  two 48px view controls, and its compact block is in `StatusBar.module.css`.
- `CompactBar` is the 56px compact app bar: a 16px title (a control where the
  item can be located) and the open page's actions. It is rendered only when
  `useCompact()` is true.
- `App` owns `compactView` (nav / editor / meta), the history entries for
  non-editor views, and the save state (`saveState`, `newPage`, `indexing`).
- The row stride, the touch-target rule, and the compact type scale are already
  in place from the last two changes.
- Material 3's navigation bar: 64dp tall (down from 80), 3–5 destinations,
  24dp icon, 12sp label, 56×32 active indicator (Android Material Components
  defaults), destinations filling the width. Apple's tab bar is 49pt plus the
  safe area, 3–5 tabs.

## Goals / Non-Goals

**Goals**

- Destinations that are a third of the screen and the full bar height, so the
  thumb has an obvious target at each.
- The save state where a status belongs, not in a navigation row.
- Compact-only, with the wide shell byte-for-byte the same.

**Non-Goals**

- No wide rail, no drawer, no sheet, no reorder of the views.
- No icon dependency; the three glyphs are inline SVG.
- No change to the app bar's title actions beyond its height and status line.

## Decisions

### D1: The bar follows the M3 navigation bar's anatomy

A `CompactNavBar` renders as a footer containing a `<nav aria-label="Views">`
with three `<button>` destinations, each `flex: 1` and 64px tall, so the whole
third of the screen is the target. Inside each: a 56×32 indicator (`border-radius:
999px`, `--brand-tint` when active), a 24px icon, and a 12px label. Active:
indicator plus `--brand` ink; inactive: no indicator, `--stone`. The bar is
ivory with a top hairline, and pads the bottom safe-area inset; its height is
`calc(64px + env(safe-area-inset-bottom))`.

The indicator is the shape signal Material uses, so the active state is not
colour alone. The icons are line drawings: Notes (list rows), Page (a document),
Details (a frame with its right panel). `aria-current="page"` reports the active
destination.

Alternative considered: keep two destinations and make each half the width.
Rejected: M3 asks 3–5 destinations for a navigation bar, and two equal halves
would still be a view switcher rather than navigation. The third destination is
the page itself, which is the honest model for this app's three layers.

### D2: The app bar grows to 64px and carries the save state

The compact app bar's title block becomes two lines: a 48px title control
(unchanged locate behavior) and a 12px status line under it, outside the button
so `role="status"` still announces. The bar is 64px, the title is 16px, and the
status is 12px `--stone`. The save-state copy moves into a shared
`src/components/saveLabel.ts` used by the app bar and the wide status bar, so
the two cannot drift: clean → none; dirty + new page → "New page: created on
first save"; dirty → "Unsaved changes"; saving → "Saving…"; failed → "Save
failed"; indexing outranks all → "Indexing notes…".

The brand screen (no item) shows no status line; the bar keeps its single title.

### D3: Selection, not toggling

Each destination calls `selectCompactView(view)`:

- The destination already shown is a no-op (Material's current destination does
  not navigate away).
- The editor is the base. Selecting it while a pushed entry exists calls
  `history.back()`, which pops the entry; the popstate handler returns to the
  landing view (the editor when an item is open). Selecting it with no entry just
  clears the chosen view.
- Selecting a non-editor view from the editor pushes one entry. Switching
  directly between the two non-editor views adds none, so Back always returns to
  the editor in one step.

The title's locate action and the row reveal keep using `showCompactView`, which
pushes when it leaves the editor. Only the destinations use the selection rule.

Alternative considered: always push for every tab change. Rejected: Notes →
Details → Back would land on Notes rather than the page, and Back would need two
presses to leave the shelf.

### D4: The wide status bar is re-stated, not rewritten

`StatusBar` loses its `compact`, `view`, and `onShowView` props, its compact
branch, its `PanelsIcon`, and its compact CSS. The wide binder keeps the path,
status group, vault group, and version. The spec's old "The status bar spans the
workspace" requirement is removed and re-added as "The status bar spans the wide
workspace"; the compact bar gets its own requirements. This is a real split of
one requirement that served two different components.

### D5: Compact only, by construction

`CompactNavBar` and `CompactBar` are rendered inside `{compact ? … : …}` in
`App`, and both CSS files are consumed only there. The breakpoint stays the one
640px query, and the wide e2e case still asserts no app bar and no view controls
at 1280px. A tablet wider than 640px keeps the three panes.

### D6: Nothing new on the typing path

The save label is computed from existing state, the bar is a render-time
component, and the destinations only set the view. No parser, index, matcher, or
filesystem work is added.

## Risks / Trade-offs

- **Chrome height**: 64px app bar plus a 64px nav bar is 128px of chrome.
  → The app bar now carries the title and the save state that were split across
  two bars, and the destinations are large enough to hit; the content keeps 713px
  at 390×844.
- **The "Page" destination is the content, not a peer.** → It is named for the
  surface it shows, and it is the honest third view. The alternative (no bottom
  bar) moves navigation to the top edge, worse for one-handed use.
- **The active indicator could read as decoration.** → The indicator is paired
  with `aria-current` and brand ink, and the label is visible for every
  destination, so the state is redundant in the right direction.
- **The history rule has edge cases** (direct Notes↔Details switches).
  → Only leaving the editor pushes; the popstate handler always returns to the
  landing view; integration tests cover both directions and Back.
- **The wide status bar could lose a behavior in the split.** → Its scenarios are
  carried over verbatim under the new requirement, the wide e2e case still
  asserts the version and counts, and `StatusBar.test.tsx` keeps its wide tests.

## Migration Plan

No stored state changes. The view choice is still session-only; the save state is
derived; the navigation bar is compact-only. Rollback is a revert. Version takes
a minor bump.
