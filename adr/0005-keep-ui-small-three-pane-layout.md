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

## Consequences

- Ship a useful navigation+editing surface early instead of spending time on visualization.
- Backlinks provide most of the graph functionality users actually need.
- Adding a graph view later is possible without invalidating the layout or the index.
- The main pane can host transient, non-file content modes: the search results view (search-results-view change) renders the full match set in the main column without touching the vault — the same category as a blank, unmaterialized journal day. The three-pane composition itself is unchanged.