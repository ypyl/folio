# Add status bar — Design

## Context

See proposal.md — Why. The shell is `grid-template-rows: auto 1fr` (header over a 4-column workspace: 56px rail, 264px sidebar, flexible editor pane, 220px meta). Status today: vault name + file count + `?` help in the header right slot; the file-path crumb sticky at the editor pane's top; the save indicator sticky at the pane's bottom inside its scroller; the "Indexing notes…" label in the pane's loading branch. The change reroutes all four into one app-level bar and simplifies the pane.

## Goals / Non-Goals

**Goals**

- One consistent, always-visible status frame across every app state.
- Relocation only: identical content, interaction, and behavior, moved.
- Simpler editor pane and header — each loses its status layers.

**Non-Goals**

- No new statuses (search match counts stay in the results view; no offline/PWA or version badge).
- No changes to save, indexing, navigation, or help-dialog behavior.
- No clickable crumbs or copy affordance (unchanged contract).

## Decisions

**D1. Shell row, outside all scrollers.** The bar is a third grid row (`auto 1fr auto`), a sibling of the workspace. It never overlaps content: panes scroll beneath it, and the pane needs no bottom clearance work — its 64px bottom padding can stay or shrink. This kills the previous change's sticky mechanics outright: the crumb's `position: sticky` and the save indicator's sticky-bottom overlay both disappear, and the pane's scroll-reset effect is untouched.

**D2. Always-on frame, three groups + a right-corner control.** The bar renders in every state; groups empty their content rather than hide. Left: path breadcrumb. After it, a vertical hairline, then the status text (save-state / indexing label) following the breadcrumb — status never floats mid-bar. The vault name · file count sits on the right side, and the `?` help button is the bar's far-right corner, after the vault stats. Empty groups are empty — no placeholder copy (Kami restraint). The `?` stays reachable on the brand empty state. Layout refinements were iterative per user feedback: the status cluster moved from far right to next to the breadcrumb with a divider, and the help button was split out to the far right corner.

**D3. Breadcrumb markup moves wholesale.** The crumb's DOM (dirs-wrapper + file-name sibling, the truncation pattern proven in add-file-breadcrumb) relocates from EditorPane into StatusBar, keyed by `page.path` with the same `title` tooltip, `aria-hidden` separators, and non-interactive styling. No redesign.

**D4. Save indicator and indexing label move as-is.** `SaveIndicator` renders inside the bar's center group with its current texts (including "New page: created on first save" for never-written pages) and its `role="status"` announcement. The "Indexing notes…" label moves from the pane's loading branch to the same group as an in-progress status; the pane keeps its decorative skeleton lines (`aria-hidden`).

**D5. Header empties; column stays.** The header grid still mirrors the workspace (brand / search / empty right column), so layout and the ui-shell mirroring requirement hold; only the slot's content leaves. Header drops its `vaultName`/`fileCount`/`onHelp` props — App passes those to StatusBar instead.

**D6. App owns composition; no new state.** App already holds everything the bar needs: `page` (path), `saveState`/`newPage` (draft), `indexing`, `activeFolder` (name + file count via `graph`), and `onHelp`/`helpOpen`. StatusBar is a presentational component with props; no hooks, no store, no remount concerns (it re-renders with App).

**D7. Requirement-level strategy for the specs.** `page-editing` uses REMOVED + ADDED (the pane-scoped text no longer describes reality and the status-bar versions need new names); `ui-shell` uses ADDED + MODIFIED with requirement names kept stable so the archive sync's name matching stays unambiguous.

## Risks / Trade-offs

- [Narrow widths squeeze three groups] → per-group `min-width: 0` with ellipsis; the crumb's truncation already protects the file name; vault name truncates with a `title` tooltip; center text is short by nature.
- [Header/EditorPane test suites assert removed structure] → their expectations move to new StatusBar tests (same assertions, new tree) — a mechanical task, not a behavior change.
- [The bar eats ~30px of vertical space in every state] → accepted; it replaces chrome that already consumed the same total height at the top and bottom, and the always-on frame stabilizes layout.
- [Dialog focus-return targets the `?` in its new home] → keep the existing `id`/`aria-controls` wiring when relocating the button so keyboard-shortcuts-help behavior is untouched.

No migration needed (UI relocation); rollback is reverting the new row and restoring the pane/header surfaces.