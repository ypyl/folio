# Add status bar

## Why

Status information is scattered across the shell: the vault's name and file count sit in the header's right slot, the open page's file path sticks to the top of the editor pane, save state floats at the pane's bottom edge, and the indexing label hides inside the pane's loading branch. The top-right corner is cluttered, the pane's own surface carries three separate status layers (top crumb, bottom save indicator, loading label), and an app-level status like "Indexing notes…" changes panes depending on which surface you see. This change gathers every piece of status into one always-visible, app-level status bar, freeing the header and the editor pane.

## What Changes

- A new bottom status bar spans the shell below the workspace: a thin, always-present frame with three groups — the open page's file path (breadcrumb, moved from the editor pane), a status slot (save state, the indexing label, and a small question-mark help button), and the active vault's name and file count (moved from the header).
- The editor pane loses its top breadcrumb, its sticky-bottom save indicator, and its "Indexing notes…" label; the header's right slot empties. All three move to the status bar. No save, indexing, or navigation behavior changes.
- The status bar is outside the pane scroll region: it is always visible and consumes no pane space. The `?` help button stays reachable from every app state, including the brand empty state.
- The keyboard-shortcuts dialog gains one dismissal path: activating the area outside the dialog (its scrim) closes it, in addition to Escape and the close control.

## Capabilities

### New Capabilities

None — the status bar is a shell arrangement over existing surfaces.

### Modified Capabilities

- `page-editing`: the file-path breadcrumb requirement moves from "top of the pane" to the app-level status bar; the save-state reporting requirement moves from a pane-bound indicator to the status bar.
- `ui-shell`: the header-slot requirement drops the vault status text (the header becomes brand and search); the help-button requirement relocates the button into the status bar; the indexing-loading requirement moves its "Indexing notes…" announcement to the status bar.

## Non-goals

- **No new statuses.** Search match counts stay in the results view; no offline/PWA state, no version badge (the version later-idea may later tenant this bar, separately).
- **No behavior changes.** Saves, indexing, and navigation are identical; the help-dialog behavior changes only in one additive way — it also closes when the user activates the area outside the dialog (its scrim).
- **No clickable breadcrumb segments** and no copy affordance (unchanged from the breadcrumb's current contract).
- **No per-pane status.** The bar is app-level; it does not mirror or duplicate any pane-internal state beyond what moves into it.

## Impact

- `src/components/StatusBar.tsx` (+ module CSS) — the new shell row.
- `src/App.tsx` — composes the bar from state it already holds (`page`, `saveState`, `newPage`, `indexing`, `activeFolder`, `onHelp`); shell grid gains a third row.
- `src/components/EditorPane.tsx` — loses the crumb, save indicator, and indexing label; keeps the editor, gutter, drop handling, and decorative loading placeholders.
- `src/components/Header.tsx` — right slot empties (column stays for layout mirroring).
- `src/components/SaveIndicator.tsx` — moves into the bar's status group (no behavioral change).
- No new dependencies, no backend, no ADR changes (UI-only per ADR-0006/0011).