# ADR-0010: Keep the editor separate from the knowledge-management layer

- Status: Accepted
- Date: 2026-09-03

## Context

Milkdown is the editor layer (ADR-0008), and filesystem access is already behind `VaultStorage` (ADR-0003). The integration between editor and vault must not blur those boundaries, or the knowledge-management logic ends up coupled to the editor and the project stops being small and maintainable.

## Decision

Keep the editor separate from the vault logic. The boundary is Markdown serialization:

```text
React PWA
   │
Milkdown Editor
   │
Markdown serialization
   │
Vault Service
   ├──────────┬──────────┐
Wikilinks  Backlinks  Journals
   └──────────┴──────────┘
   │
File System Access API
   │
Markdown files
```

Responsibilities:

- **Milkdown owns:** editing experience, Markdown parsing, Markdown serialization, formatting.
- **The application owns:** file storage, vault indexing, page resolution, backlinks, tags, journals, search.

Custom editor nodes (e.g., wikilinks) communicate through the same Markdown representation; the underlying file stays normal Markdown (ADR-0009).

## Consequences

- The knowledge-management layer is editor-agnostic and testable without a UI.
- The editor can be replaced later without touching vault logic, and vice versa.
- The two layers meet at one narrow seam (serialized Markdown), keeping the project small.