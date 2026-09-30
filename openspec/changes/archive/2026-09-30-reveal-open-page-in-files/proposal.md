## Why

The status bar already names the open page in its path breadcrumb, but the page name is inert text. The Files listing shows every page as a row, yet it is a single scroll region and is windowed, so in a large or scrolled vault the open page's row sits far outside the visible part of the list with no way to bring it back. Naming the open page in the status bar and offering no way to reach it there is a dead end the user has to scroll for manually.

## What Changes

- In the status bar's path group, the **page-name crumb becomes a control** when the open item is a page that has a row in the Files listing. Activating it reveals that row: it unfolds the left navigation when folded, opens the Files section when collapsed, scrolls the row into view, and moves keyboard focus to the row.
- The directory crumbs, the status text, and the vault name stay non-interactive, exactly as today. A board's breadcrumb and a journal day's breadcrumb stay non-interactive text as well.
- Revealing changes nothing else: it does not navigate, does not re-open the page, does not change the editor's content, does not reorder the listing, and writes nothing to the vault.
- The status bar requirement's "the Back, Forward, and Today controls are the bar's only controls" clause and its "the bar performs no actions" scenario are narrowed, since the page name now acts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-shell`: the status bar's path group gains one control — the page-name crumb — and the bar's "only controls" and "performs no actions" clauses are narrowed to the parts that remain inert. A new requirement defines the reveal behavior.

## Impact

- **Components:** `StatusBar` (the page-name crumb renders as a button when the app supplies a reveal handler), `App` (wiring: decide when the crumb is a control, unfold the left navigation, delegate to the sidebar), `Sidebar` (an imperative reveal that opens the Files section, scrolls the active row into view, and focuses it).
- **No new dependency, no new route, no data model change.** The reveal is a view operation over already-built in-memory data.
- **Typing path:** unchanged. Reveal runs on a click, never on a keystroke.
- **Vault:** unchanged. Revealing reads nothing from disk and writes nothing (ADR-0001, ADR-0009, ADR-0015 untouched).
- **Specs:** a delta for `ui-shell` only. The `static-navigation` Files-listing guarantee that the open item's row is always rendered and marked is what makes the reveal possible and needs no change.
- **ADRs:** no new ADR required. The change stays inside ADR-0005 (three-pane shell) and ADR-0006 (keep it small).

## Non-goals

- **No reveal for boards, journal days, or assets.** Only a page's name is a control. A board's breadcrumb stays inert text even though boards also have Files rows; journal days live in the Journal calendar, not the Files listing.
- **No new control surface.** No separate "reveal" button beside the crumb, no context-menu item, no keyboard shortcut. The page name itself is the control.
- **No change to the Files listing** — its order, its groups, its rows, its windowing, and the active-row marking are untouched.
- **No OS-level "show in file explorer"** and no folder picker. "Files listing" means the sidebar section, not the operating system's file manager.
- **No persistence.** Which page is revealed is not stored anywhere.
- **No backend, no database, no block-addressed document model** (ADR-0006, ADR-0009).
