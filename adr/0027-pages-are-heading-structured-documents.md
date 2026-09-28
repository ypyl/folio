# ADR-0027: Pages are heading-structured documents, not outliners

- Status: Accepted
- Date: 2026-09-28

## Context

Folio is a Logseq alternative, and the Logseq habit is that structure lives in nested bullets: an outline whose meaning comes from depth. Two earlier decisions already reject that model underneath: ADR-0006 keeps the app small and refuses to rebuild Logseq, and ADR-0009 rejects the block-based document model an outliner is built on. But the interface still leaned that way. ADR-0026 gave every list item with children a fold control in its own left rail — a Logseq-style affordance whose only payoff is a deep outline — and it left a permanent thin control lane beside the prose.

Folio's Markdown is a document, not a graph of blocks. A reader who opens the file in any other tool should see a page whose structure is legible from its headings, not a wall of indented bullets whose meaning depends on depth.

## Decision

Folio pages are heading-structured documents, not outliners.

- **Structure lives in headings.** A page's shape is carried by `#`/`##`/`###` levels, which any Markdown reader renders as sections.
- **Lists are for enumerations, not structure.** A list item states one thing; nesting is not the primary way a page organizes itself.
- **The interface rewards headings, not nesting.** The app does not build affordances whose only payoff is deep bullet nesting. List-item folding (ADR-0026) is removed with this decision, together with the left rail that held its controls. Help finding one's way through a page belongs to a reading surface over its headings, not to a control drawn beside every nested item.
- **Markdown stays canonical.** Nothing here introduces a block, an id, or a metadata property. This is a decision about what the interface encourages, not a new document model (ADR-0001, ADR-0009).

## Consequences

- ADR-0026 is superseded: its view-only folding mechanism is gone. The disclosure control and the editor's left rail are removed, and nested list content is always shown.
- Lists keep their native markers, indentation, and editing behavior (ADR-0020). This decision changes no list syntax and writes nothing to the vault.
- The editor seam shrinks: the fold API and the layout-change channel it needed leave the editor contract (ADR-0010).
- The Logseq importer still copies bullet-heavy graphs as they are (ADR-0025). This decision names prose and headings as the destination style; the app does not rewrite an imported page, it simply stops rewarding the other shape.
- A table-of-contents surface over headings is the intended replacement for folding's navigation value. It is a separate decision and is not introduced here.
