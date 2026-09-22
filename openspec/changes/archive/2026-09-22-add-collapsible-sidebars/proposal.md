## Why

The three-pane workspace (ADR-0005) gives the editor only what the two fixed side panes leave. On a narrow window, or when the user is just writing, the sidebar and meta panel hold space they are not earning. There is no way to fold them away and give the width back to the page.

## What Changes

- Add a thin, full-height **collapse control** on the outer edge of each collapsible side pane:
  - one strip between the folder rail and the left sidebar,
  - one strip at the workspace's right edge, beside the meta panel.
- Each strip is a vertical button the height of the workspace, showing an arrow that points toward the pane's own edge while open and toward the editor while collapsed.
- Activating a strip collapses or expands its pane; the freed width goes to the flexible center editor pane.
- The collapsed/expanded state is **session-only**: it lives in React state, resets to expanded on reload, and is never written to the vault or any storage (Markdown stays the only source of truth, ADR-0001; no app database, ADR-0009).
- The folder rail is **not** collapsible — it stays a fixed 56px column.
- The header collapses its matching column in step with each pane, so the search input stays centered over the editor.
- Collapsing is a layout-only change: no page navigation, no editor state, no vault read.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui-shell`: the shell layout gains two full-height collapse controls and the rule that the left sidebar and right meta panel can each collapse to a thin strip, with the header columns mirroring the collapsed/expanded state.

## Non-goals

- No changes to the sidebar accordion's own sections, the meta panel's own sections, or their independent open/close behavior.
- The folder rail is not collapsible.
- No persistence of the collapsed state across reloads; no `localStorage`, no IndexedDB, no vault file.
- No keyboard shortcut, menu item, or settings surface for the toggle.
- No resizable/draggable pane widths and no per-pane width persistence.
- No change to the mobile/narrow-window story; Folio stays Chromium-desktop-first (ADR-0002).
- No new ADR: this stays inside ADR-0005 (keep the UI small) and ADR-0011 (Kami tokens). If anything, it strengthens ADR-0005 by not adding features.

## Impact

- `src/App.tsx` and `src/index.css` (workspace grid: two new fixed strip columns plus a collapsed state per pane).
- `src/components/Header.tsx` + `Header.module.css` (mirror the collapse in the header grid).
- One new presentational component for the strip button, with its `*.module.css`, plus its test.
- `openspec/specs/ui-shell/spec.md` via the delta in this change.
- No dependency changes, no `VaultStorage` changes, no index or editor changes. The typing path is untouched: a keystroke still sees the same memoized props; toggling a pane is a grid-template-columns change and does no work proportional to vault or document size.
