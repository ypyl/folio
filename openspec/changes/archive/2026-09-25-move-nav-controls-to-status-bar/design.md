## Context

The sidebar's first band is `.controls` in `Sidebar.tsx`: Back, Forward, and Today, with a local `todayTick` state that bumps `JournalCalendar` so Today re-anchors a calendar the user browsed away from. The status bar (`StatusBar.tsx`) is a flex row whose first item is `.lead`, a `--rail-w`-wide cell holding the pin and a right border that continues the rail's border. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**

- Move Back, Forward, and Today into the status bar's leading edge, before the pin.
- Leave the sidebar as the four-section accordion with no control row.
- Keep trail semantics, Today's behavior and disabled rule, and the pin's behavior unchanged.

**Non-Goals:**

- No change to the workspace grid, the folder rail, or pane collapse.
- No new shared navigation component unless the bar alone needs it.

## Decisions

**Render the controls in `StatusBar`, delete them from `Sidebar`.** The bar is their only user, so a new component would be indirection with one caller. Move the chevron helper out of `Sidebar.tsx` into `StatusBar.tsx` and move the `.control*` rules from `Sidebar.module.css` into `StatusBar.module.css`, sized for the bar. Alternative considered: a shared `NavControls` component. Rejected: the sidebar no longer shows these controls, so there is nothing to share.

**Lift the Today re-anchor tick to `App`.** `todayTick` exists so Today re-anchors the calendar when today is already the open page (no `activePath` change to observe). With Today in the bar, `App` owns the tick: `handleToday` bumps it and opens today, and `App` passes `todayTick` to `Sidebar`, which forwards it to `JournalCalendar`. Alternative considered: keep the tick in `Sidebar` behind a signal prop from `App`. Rejected: same state, one extra prop. The tick changes only on a click, so the memoized sidebar re-rendering there touches no keystroke path.

**Move the navigation props from `Sidebar` to `StatusBar`.** `canBack`, `canForward`, `onBack`, `onForward`, and a Today enable flag plus `onToday` leave `Sidebar`'s props and join `StatusBar`'s. `App`'s handlers are already `useCallback`, so the bar's re-render cost is unchanged and the memoized sidebar gains stability by losing props.

**Drop the rail-aligned leading cell.** `.lead` (rail-width cell plus its right border) is replaced by a content-sized navigation group; the pin follows it. This is the visible consequence the proposal flags: the bar stops continuing the rail's border. Alternative considered: keep a rail-width cell before the nav group. Rejected: it would push the controls right of the rail column, not into the leading corner the user asked for, and the star would still not align with the rail.

**Keep available/disabled rules with the controls.** Back/Forward stay disabled when the trail has no entry in that direction; Today stays disabled while no vault is usable. Only their DOM location changes, so page-history's requirements and the journal-calendar re-anchor rule are untouched.

## Risks / Trade-offs

- [The rail's border no longer continues into the status bar] -> Intended by the requested layout and called out in the proposal. If the aligned column must stay, the nav controls would have to sit right of it instead.
- [Tests query the sidebar for Back/Forward/Today] -> `App.test.tsx` has a `nav()` helper scoped to the sidebar and several cases that click those controls. Update them to query the status bar, and add a DOM-order assertion there.
- [jsdom has no layout, so bar order cannot be checked visually] -> Assert document order (nav group before pin before breadcrumb) rather than computed geometry.
