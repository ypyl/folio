## Why

The History section added by `add-page-history` does not survive a real vault. It sits below the whole Pages list in a single scrolling sidebar, so at a few thousand pages reaching it means scrolling past everything else, and at 10,000 pages the sidebar costs about 5.4 s of DOM work just to build (measured in that change's `design.md`). The trail itself is useful; the way it is presented and the way the list above it is rendered are not. This change replaces the section with a control that is always in reach, gives the trail the model that back and forward actually need, and stops the Pages list from rendering every page in the vault.

## What Changes

- **Remove the History accordion** from the sidebar. The trail stays as state; the buttons become its only UI.
- **Add a navigation control row above the Journal section**: a sticky row with a Back and a Forward button, each disabled when there is nowhere to go. Sticky so it stays reachable while the sidebar scrolls, which is the point of the change.
- **Give the trail a cursor**: it becomes a visit log with a position instead of a de-duplicated move-to-front stack. A new navigation appends after truncating anything ahead of the cursor (browser semantics); pressing Back or Forward moves the cursor without adding an entry; consecutive repeats are skipped, so Back always lands on a different page. Still capped at 20, still session-only, still cleared when the folder changes.
- **Window the Pages list**: render only the rows in view, with spacers preserving the scroll extent, so the list costs what the viewport costs rather than what the vault costs. The list keeps its order, its active-page marking, and its full size for assistive technology (list semantics with `aria-setsize` and `aria-posinset`), and the open page's row is always rendered.
- **BREAKING (recorded, not user-visible)**: the `page-history` requirements for the sidebar section are removed, and `ui-shell` goes back to two collapsible sections plus the new control row.

## Capabilities

### New Capabilities

None. Every requirement here belongs to a capability that already exists.

### Modified Capabilities

- `page-history`: the trail becomes a visit log with a cursor (truncation on new navigation, consecutive repeats skipped, back/forward move the cursor without appending); the two section requirements are removed; a new requirement covers the Back/Forward controls and their disabled states.
- `ui-shell`: the sidebar is two collapsible sections again (Journal, Pages) with a navigation control row above them, which the current wording explicitly forbids ("no other sections, controls, or buttons above or between them"); the loading-placeholder requirement loses its History clause.
- `static-navigation`: the Pages list renders only the rows in view while remaining, to the user and to assistive technology, the complete list of the vault's pages.

## Non-goals

- **No keyboard chords for Back/Forward.** They are controls only. Adding chords later means new rows in the keyboard-shortcuts reference and in its drift guard, which is its own change.
- **No browser history integration.** No `pushState`, no URL routing; the browser's own Back button is left alone, and Folio gets no router.
- **No trail UI besides the two buttons.** No dropdown, no popover, no replacement list: the section is removed rather than relocated, and nothing takes its place.
- **No trail persistence.** Still memory only, per session, per folder; `.folio/` stays untouched.
- **No windowing of the Journal calendar** (42 cells) or the meta panel's link lists (sized by the open page, not by the vault).
- **No change to the memo work from `add-page-history`.** It stays and is re-measured, but windowing is what carries this change's cost claim.
- **No new ADR.** No vault state, no persistence boundary, no cross-ADR coupling; the decisions are recorded in `design.md`.

## Impact

- `src/history.ts`: the log-and-cursor model (append with truncation, step back, step forward, cap with the cursor following).
- `src/App.tsx`: cursor state, the recording effect's suppression while stepping, and the two control handlers.
- `src/components/Sidebar.tsx` and its CSS module: control row added, History section and `HistoryRow` removed, Pages list windowed.
- A pure windowing helper (which slice of the list to render) with its own test, plus the measurement that shows the mount and render cost at 10,000 pages before and after.
- Specs: `page-history`, `ui-shell`, `static-navigation`.
- Related ADRs: ADR-0001 (nothing new in the vault), ADR-0004 (in-memory state is disposable), ADR-0005 and ADR-0006 (the shell stays small), ADR-0013 (no change to I/O).
