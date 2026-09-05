# ADR-0012: Unified page references

- Status: Accepted
- Date: 2026-09-04

## Context

Wikilinks and tags have historically been treated as separate concepts: tags as labels, wikilinks as page-to-page links. Folio is a new application (no migration compatibility; other tools' conventions are not features — see AGENTS.md), and it derives everything from a folder of Markdown files. Two concepts that resolve to the same thing — a page — add parser, index, and UI machinery without adding value.

## Decision

There is **one namespace: pages**. Every reference targets a page regardless of how it is written.

- Folio's reference forms are `#word` and `#[[Page]]` — two syntactic variants of the same thing, not features. Plain `[[Page]]` wikilinks are not a reference form and render as Markdown text.
- A reference to a page that does not exist yet is valid; the page is materialized when opened (delayed creation).
- Tags are not a separate concept: `#word` is a reference to the page `word`. There is no tags UI and no tag-vs-page distinction anywhere.
- Folio defines its own reference forms and owes nothing to other tools' conventions.

## Consequences

- Parser, index, and editor handle one concept (page references) in two lexical forms.
- Backlinks collect every reference form: a page's backlinks include all notes containing the page name, however written.
- The index simplifies (ADR-0004): one `links` list, with the lexical form retained only for display.
- Existing vaults using other conventions (including plain `[[Page]]` wikilinks) are read as Markdown text, but their conventions are not features.