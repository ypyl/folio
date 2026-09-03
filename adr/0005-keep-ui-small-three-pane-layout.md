# ADR-0005: Keep the UI small: three-pane layout, no graph visualization

- Status: Accepted
- Date: 2026-09-03

## Context

Folio deliberately does not rebuild Logseq (ADR-0006). Graph visualizations are complex to build and maintain, and most of their practical value (discovering what links to what) is already delivered by backlinks.

## Decision

Keep the UI intentionally small with a **three-pane layout**:

```text
┌──────────┬────────────────────────┬──────────────┐
│ Sidebar  │ Main Editor / Page     │ Backlinks    │
│          │                        │              │
│ Journal  │ Machine Learning       │ Linked from  │
│ Pages    │                        │              │
│ Tags     │ Content...             │ [[AI]]       │
│ Search   │ [[Neural Networks]]    │ [[Research]] │
└──────────┴────────────────────────┴──────────────┘
```

Sidebar holds journal, pages, tags, and search. The center pane is the editor/page. The right pane shows backlinks. Do **not** build a graph visualization initially.

## Consequences

- Ship a useful navigation+editing surface early instead of spending time on visualization.
- Backlinks provide most of the graph functionality users actually need.
- Adding a graph view later is possible without invalidating the layout or the index.