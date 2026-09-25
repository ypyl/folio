## Context

The shell renders a five-column workspace (`src/index.css`): `rail | left strip | sidebar | editor | meta panel | right strip`. One session flag, `leftCollapsed` in `src/App.tsx`, drives `.app-shell.left-collapsed`, which zeroes `--sidebar-cur`. `FolderRail` is a fixed 56px column with no collapsed state. The left strip sits between the two, so it can only fold the sidebar. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**

- Move the left strip to the workspace's leading edge and make one toggle fold the folder rail and the left sidebar together.
- Keep the collapsed state a pure layout change: no persistence, no vault or editor work.

**Non-Goals:**

- No separate rail flag, no persistence, no shortcut or settings.
- No change to the right strip or its flag.

## Decisions

**One flag zeroes two tracks.** Reuse `leftCollapsed`; add `--rail-cur` next to `--sidebar-cur` (default `var(--rail-w)`, `0px` under `.left-collapsed`). New column order: `strip | rail-cur | sidebar-cur | editor | panel | strip`. Rationale: the rail and sidebar are one unit, so one state and one toggle stay the simplest thing that works (ADR-0005). Alternative considered: a second flag for the rail. Rejected: it would add a state and a control the user did not ask for, and could leave the rail alone on screen, which is the problem being fixed.

**The rail hides like the sidebar, not with `display: none`.** Add a `collapsed` prop to `FolderRail` that applies `visibility: hidden; overflow: hidden; padding: 0; border-width: 0`, the same pattern `Sidebar.module.css` uses. Rationale: `display: none` makes a grid item skip auto-placement, shifting every later column; `visibility: hidden` keeps the item's grid slot while the zero-width track does the hiding, and takes the rail's controls out of the tab order. Alternative considered: unmounting the rail. Rejected: more code, and it loses nothing that visibility does not already solve.

**The strip moves left; arrow semantics stay.** Render `PaneCollapseToggle side="left"` before `FolderRail`. The existing arrow rule already reads correctly: expanded points to the unit's outer edge (left), collapsed points back to the editor. No glyph change.

**The strip names the unit it now folds.** Left strip accessible name becomes `Collapse left navigation` / `Expand left navigation`, and its `aria-controls` becomes the space-separated list `folder-rail sidebar-pane`. `FolderRail`'s `nav` gains `id="folder-rail"`. Rationale: `aria-controls` accepts multiple ids, so the control can name both regions without new DOM. Alternative considered: wrapping both in one labeled container for a single id. Rejected: extra element and CSS for no behavioral gain.

**Keystroke budget unaffected.** Toggling flips a class and two CSS custom properties. No new props flow into the memoized `Sidebar` on keystrokes; `App` already keeps its inventories referentially stable.

## Risks / Trade-offs

- [The rail's controls (brand home, search, add) are unreachable while folded] -> Expected: the left strip stays visible and is the documented way back. The strip keeps its full-height hit area.
- [The workspace grid change and moved strip break existing tests and any column-order assertion] -> Update `App.test.tsx`, `FolderRail.test.tsx`, and `PaneCollapseToggle.test.tsx` in the same change; add a case that the rail is hidden and non-focusable while folded.
- [`aria-controls` pointing at two ids is ignored by some assistive tech] -> The accessible name alone still says what the control folds and `aria-expanded` carries the state; the extra id is additive, not load-bearing.
