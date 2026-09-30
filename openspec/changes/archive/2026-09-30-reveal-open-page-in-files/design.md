# Design

## Context

See `proposal.md` — Why. The pieces this change assembles already exist:

- `StatusBar` (`src/components/StatusBar.tsx`) derives the path group from `pagePath.split('/')` and renders directory segments, a `/`, and the last segment as inert `<span>`s. It is the only surface that names the open item.
- `Sidebar` (`src/components/Sidebar.tsx`) owns the one windowed Files listing. It already computes `activeIndex = rows.findIndex(row => row.path === activePath)` and passes it as `keep` to `windowPieces(...)`, so the open item's row is always in the document and marked `data-active` even when it is scrolled out of view. There is no scroll-to-active.
- The Files listing sits inside the sidebar's Files `<details>` (`Accordion`, uncontrolled, `defaultOpen`) inside `<aside id="sidebar-pane">`. `App` folds the whole left navigation with `leftCollapsed`, which is `display: none`.
- `App` already builds and memoizes the `rows` array it passes to `Sidebar`, and knows whether the open item is a board (`mode === 'board'`).

Constraints: Markdown stays canonical and this reveals nothing new about it; the typing path must not grow; the pane boundary (`VaultStorage`) is untouched because revealing reads nothing from disk.

## Goals / Non-Goals

**Goals:**

- The status bar's page name becomes the trigger, and only for the case the proposal lists.
- The reveal reuses the listing's existing windowing guarantee rather than adding a second scroll model.
- The click adds nothing to the typing path and no new render on keystrokes.

**Non-Goals:**

- Revealing boards, journal days, or assets (proposal non-goals).
- Changing the listing's order, groups, or row markup.
- A controlled `Accordion` refactor, a reveal store, or persistence.

## Decisions

**D1 — The last crumb is the control, gated in `App`.** `App` finds the active row in its own `rows` array and passes a reveal handler to `StatusBar` only when that row's `kind === 'page'`. `StatusBar` renders the last segment as a `<button>` when the handler is present and inert text otherwise. Gating on the row (not on "is a page object") keeps journal days out for free, since journal days are `Page` objects but have no Files row. A board's crumb stays inert per the proposal's non-goals.

**D2 — `App` to `Sidebar` by imperative handle, not a signal prop.** `Sidebar` gains a `useImperativeHandle` exposing `revealActive()`, matching `EditorPaneHandle`'s precedent. Alternative considered: a changing `revealSignal` prop — rejected because it re-renders the memoized sidebar and needs a mount-time guard against a stale signal, while a ref leaves the memo's props (and therefore its identity) untouched and keeps the click off the render path entirely.

**D3 — Unfold first, then reveal on the next commit.** A folded left navigation is `display: none`, so nothing inside it can take focus. `App` sets `leftCollapsed = false`, records a pending reveal in a ref, and performs the reveal in an effect once `leftCollapsed` is false. Alternative considered: `flushSync` around the state update — rejected as a heavier hammer for the same one-frame handoff.

**D4 — Reveal mechanics read the DOM the listing already produces.** `revealActive()` walks from the listing element to its enclosing `<details>`, sets `.open = true` when it is closed, then finds the row with `[data-active]`, calls `scrollIntoView({ block: 'nearest' })`, and focuses it. `windowPieces`'s `keep` already guarantees that row is rendered whether or not the row is near the window, and `block: 'nearest'` scrolls the minimum distance so the row lands on screen without yanking the list. Alternative considered: making `Accordion` controlled — rejected because it changes a component shared by six sections to serve one caller; the direct `open` write cannot fight React, because React's virtual DOM already holds `open === true` for this section and writes nothing on the next render.

**D5 — Focus, not selection, is the payload.** Reveal marks nothing new and stores nothing; the row is already the active one, so the outcome is scroll plus keyboard focus, which is what "focus item" asks for. The focus target is the row's existing `<button>`, so visible focus styling, Enter-to-open, and the row's own `aria-current` all come for free.

**D6 — The control is a plain button with an accessible name.** The page name renders as a `<button>` whose accessible name names the page and the action ("Reveal `<name>` in Files"), so it is reachable by Tab and activatable by Enter/Space with no extra key handling.

## Risks / Trade-offs

- [Narrowing a previously inert surface] → Keep every other segment of the path group inert, keep the journal-day and board cases explicitly inert, and cover both with scenarios and tests.
- [Focus leaves the status bar for the sidebar] → Accepted; it is the requested behavior. The next Tab continues from the sidebar row, which is where the user's attention just moved.
- [Direct `.open` write on the Files `<details>`] → Safe only while that section is `defaultOpen`; noted in D4. If the section ever gains a controlled open state, `revealActive` must route through it instead.
- [Reveal before the listing has laid out] → `scrollIntoView` on a freshly unfolded pane still works, but the effect runs after the commit that unfolds, so the row has a box by then; the browser-verification task exercises exactly this path.

## Migration Plan

None. Nothing is persisted, no vault file changes, and no stored value is read. Rollback is reverting the commit.
