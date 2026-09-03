# ADR-0009: Keep Markdown as the canonical document model — reject block-based editing

- Status: Accepted
- Date: 2026-09-03

## Context

When selecting an editor (ADR-0008), BlockNote was considered. BlockNote uses a block-based document model similar to Notion:

```text
Document → Block model → Editor UI
```

That architecture suits Notion-style applications, but Folio's philosophy is:

```text
Markdown file → Editor UI → Markdown file
```

The Markdown file must remain the canonical representation of a page.

## Decision

Reject the block-based document model. Do not introduce an internal document model between the editor and the files.

The risks avoided by this decision:

- internal document models that drift from the file contents
- Markdown ↔ block conversion complexity
- hidden metadata or annotations that live outside the files
- synchronization problems between editor state and the vault

Milkdown fits because Markdown remains the primary data structure (ADR-0001, ADR-0008).

## Consequences

- A page's canonical state is always the plain `.md` file; anything else can be regenerated (ADR-0001, ADR-0004).
- No migration or export path is needed to leave Folio — files stay portable.
- Editor features must be expressed within Markdown semantics; content that has no Markdown representation (e.g., block attributes) is out of scope.