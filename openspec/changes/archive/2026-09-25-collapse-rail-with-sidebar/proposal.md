## Why

Folding the left sidebar still leaves the 56px folder rail (brand, search, add control, folder avatars) on screen, so the width the toggle was supposed to return to the page is partly spent on chrome. The toggle also sits between the rail and the sidebar, so it reads as a control for the sidebar alone, not for the whole left navigation.

## What Changes

- Move the left collapse strip to the workspace's leading edge, to the left of the folder rail.
- Make that one strip fold the folder rail and the left sidebar together, as a single left-navigation unit. The flexible editor pane takes both widths back.
- Keep the strip in place while collapsed, showing the expand arrow, so the left navigation can be restored. Arrow direction keeps its current meaning: toward the pane's outer edge while expanded, toward the editor while collapsed.
- Give the strip an accessible name and `aria-controls` that describe the combined unit it now folds, instead of the sidebar alone.
- Leave the right meta panel and its strip unchanged, including their independence from the left side.
- Keep the collapsed/expanded state session-only: in memory, reset on reload, never persisted.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui-shell`: the workspace column order and the folder rail's collapsibility change (the rail is no longer fixed and never-collapsed), and the side-pane collapse requirement changes so the left strip sits at the workspace's leading edge and folds the rail together with the left sidebar.

## Impact

- `src/App.tsx` (order the folder rail after the left strip; pass the collapsed state to the rail).
- `src/index.css` (workspace grid columns; a live `--rail-cur` width that the left collapse zeroes).
- `src/components/FolderRail.tsx` + `FolderRail.module.css` (a collapsed state that removes the rail's box and its controls from the tab order).
- `src/components/PaneCollapseToggle.tsx` (accessible name and `aria-controls` for the combined left-navigation unit).
- Tests: `src/App.test.tsx`, `src/components/FolderRail.test.tsx`, `src/components/PaneCollapseToggle.test.tsx` (and any snapshot of the shell grid rule).
- `openspec/specs/ui-shell/spec.md` via this change's delta spec.
- No dependency changes, no `VaultStorage` changes, no index or editor changes. The typing path is untouched: toggling the left side stays a `grid-template-columns` change and does no work proportional to vault or document size.

## Non-goals

- No independent rail collapse: the rail and the left sidebar fold and unfold as one unit.
- No persistence of the collapsed state across reloads; no `localStorage`, no IndexedDB, no vault file.
- No keyboard shortcut, menu item, or settings surface for the toggle.
- No change to the right meta panel, its strip, or its collapse behavior.
- No change to the folder rail's controls or the brand's home behavior; they are simply hidden while the left navigation is folded.
- No header: the shell still renders no standing band above the workspace (ADR-0005).
- No new ADR: this stays inside ADR-0005 (keep the UI small) and ADR-0011 (Kami tokens).
