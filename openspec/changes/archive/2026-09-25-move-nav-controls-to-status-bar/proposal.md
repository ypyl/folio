## Why

The sidebar's first band is its most valuable space (always visible, always in reach) and it holds three navigation controls: Back, Forward, Today. At the same time the status bar's leading cell is a folder-rail-wide column holding only the pin star. Moving the three controls into the status bar's leading corner frees the sidebar to lead with its listings and gathers the app's persistent controls in one place.

## What Changes

- Move **Back**, **Forward**, and **Today** out of the sidebar's navigation control row and into the status bar's leading edge, in that order.
- The status bar's left-to-right order becomes: Back, Forward, Today, pin star, breadcrumb (file path), status text, then the vault name, file count, and version at the trailing edge.
- The sidebar becomes exactly four collapsible sections (Journal, Pages, Boards, Assets) with no control row above them, so Journal is the first band.
- **Consequence, called out because it reverses an earlier design:** the status bar's rail-aligned leading column and the hairline continuing the rail's right border are removed. Navigation controls now occupy the leading edge, so the pin star can no longer sit at the rail's x. This supersedes `align-status-bar-pin-column` and `continue-rail-border-in-status-bar`. If the rail-aligned pin column should stay, the nav controls must move right of the 56px column instead of into the corner.
- Back and Forward keep their trail semantics (page-history) and Today keeps its behavior and disabled rule; only their location changes.
- Today keeps re-anchoring the journal calendar, so that state moves from the sidebar to the app shell.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui-shell`: the sidebar requirement loses its navigation control row and its control-related scenarios; the status bar requirement gains the three navigation controls and its "no action other than the pin" rule is narrowed to the display-only groups; the journal-calendar requirement points at the status bar instead of the sidebar's control row; the rail-aligned leading-column requirement is removed.

## Impact

- `src/components/StatusBar.tsx` + `StatusBar.module.css` (render Back, Forward, Today at the leading edge; new layout).
- `src/components/Sidebar.tsx` + `Sidebar.module.css` (remove the control row, its chevron icon, and its styles; keep the calendar).
- `src/App.tsx` (pass the navigation props to `StatusBar` instead of `Sidebar`; own the calendar's Today re-anchor tick).
- Tests: `StatusBar` (new), `Sidebar`, and `App` collapse/history/calendar cases.
- `openspec/specs/ui-shell/spec.md` via this change's delta. `page-history` needs no requirement change (it never specified placement), though its Purpose sentence "a trail in the sidebar" can be touched up.
- No `VaultStorage`, index, or editor changes. No keystroke-path cost: the moved controls are `useCallback` handlers and primitives, so the memoized sidebar still skips re-rendering while typing.

## Non-goals

- No change to trail semantics, Back/Forward availability, or Today's open-and-materialize behavior.
- No change to the pin star's behavior, label, or states; only its position.
- No change to the status text, the vault group, or the version badge.
- No keyboard shortcut, menu item, or settings surface added.
- No change to the folder rail, the pane collapse behavior, or the workspace grid.
- No new ADR: this stays inside ADR-0005 (keep the UI small) and ADR-0011 (Kami tokens).
