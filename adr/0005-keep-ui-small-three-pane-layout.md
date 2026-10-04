# ADR-0005: Keep the UI small: three-pane layout, no graph visualization

- Status: Accepted
- Date: 2026-09-03

## Context

Folio deliberately does not rebuild Logseq (ADR-0006). Graph visualizations are complex to build and maintain, and most of their practical value (discovering what links to what) is already delivered by backlinks.

## Decision

Keep the UI intentionally small with a **three-pane layout** under a single header row:

```text
+---------------------------------------------------+
| Header: brand | search (centered) | storage slot  |
+----------+------------------------+---------------+
| Sidebar  | Main Editor / Page     | Meta panel    |
| [New]    |                        | Backlinks     |
| Journal  |                        | Forwardlinks  |
| Pages    |                        |               |
+----------+------------------------+---------------+
```

- Sidebar is an accordion: a **New Page** button, a collapsible **Journal** section (holds the calendar), and a collapsible **Pages** section. There is no Tags section: tags are pages (ADR-0012).
- **Search lives in the header**, centered over the content column — not in the sidebar.
- The right pane is an accordion of page metadata: **Backlinks** and **Forwardlinks**.
- Do **not** build a graph visualization initially.

This decision revises the composition described earlier in this ADR (search and tags in the sidebar, backlinks-only right pane) under the unified-page-references model (ADR-0012).

### The compact composition (add-compact-mobile-shell)

The three-pane layout is the composition for a viewport wider than the compact breakpoint (`src/compact.ts` owns the width; the workspace stylesheet applies it). At or below it the shell shows **one view at a time** — the navigation view (the rail and sidebar together), the editor view, or the meta view (the right panel) — drawn from the same panes and the same props. There are no collapse strips and nothing folds. With no open item the navigation view leads; with an item open the editor leads, and any navigation returns to the editor. Showing a view pushes a history entry, so the Android Back button and the Back gesture close the view instead of leaving the app.

The status bar, already the shell's only full-width control row and already the holder of Back, Forward, and Today, is the compact composition's app bar: it gains a navigation view control at its leading edge and a meta view control at its trailing edge, and drops the breadcrumb path, the folder statistics, and the version, because one non-scrolling phone-width row cannot hold them. This is why there is still no header band above the panes.

Alternatives rejected:

- **Rendering only the active view (a true swap).** Simplest DOM, but it unmounts the editor, losing CodeMirror's instance, its undo history, its scroll position, and its selection, and paying a fresh mount on every return. The compact layers cover the editor instead: it stays laid out at full size and is hidden with `visibility`, so its box — and its measurement — never change.
- **Zeroing the editor's grid track while a view is shown.** Reuses the existing collapse lever but gives CodeMirror a zero-width box and forces a re-measure on return, for the same reason.
- **A scrimmed, focus-trapped drawer opened by a gesture.** Both screen edges belong to Chrome on Android (swipe-in from the left is Back, from the right is Forward) and cannot be claimed from the page, so a gesture could not open a drawer anyway; the scrim, the z-index, and the focus trap would buy little on a phone-width screen where a full-width view reads cleanly.
- **A view stack behind a router.** The app has no router, and remounting is the cost the first alternative is rejected for.

## Consequences

- Ship a useful navigation+editing surface early instead of spending time on visualization.
- Backlinks provide most of the graph functionality users actually need.
- Adding a graph view later is possible without invalidating the layout or the index.
- The main pane can host transient, non-file content modes: the search results view (search-results-view change) renders the full match set in the main column without touching the vault — the same category as a blank, unmaterialized journal day. The three-pane composition itself is unchanged.
- A phone-sized vault is usable on Chrome for Android 132 and later, where the directory picker the whole model rests on (ADR-0002) finally exists. The compact composition adds no capability and no persistence: it is a layout and a class flip, the view it shows is session-only, and nothing is written to the vault, to IndexedDB, or anywhere else.
- The editor-responsiveness budget (AGENTS.md) is untouched: showing or closing a view re-parses nothing, re-serializes nothing, reads no file, and allocates nothing per item.