# ADR-0006: Scope guardrails: do not rebuild Logseq

- Status: Accepted
- Date: 2026-09-03

## Context

The motivating problem is a lightweight, local-first tool for navigating and editing a Markdown knowledge base. Logseq itself is feature-rich, and feature creep is the main risk to finishing a small, focused tool. The principle: **the simplicity itself is the product.**

## Decision

Build only what is needed to open, edit, and index a local Markdown folder:

- Open a local folder/vault
- Read and write `.md` files directly
- Markdown editor + preview
- `[[wikilinks]]`
- Backlinks
- Tags such as `#ai`
- Daily journal pages
- Full-text search
- Auto-save
- Basic page navigation

Explicitly **out of scope** (initially): block-level database, complex queries/query language, collaboration, sync, whiteboards, plugin ecosystem, complex graph visualization, backend/database infrastructure.

## Consequences

- The MVP stays shippable: open folder, scan, display, edit, save, wikilinks, backlinks, journal, search, auto-save — then stop and use it.
- Tempting Logseq features will be deferred; that is a feature, not a gap.
- Each deferred feature can be revisited as a separate ADR when a concrete need appears.