# ADR-0008: Use Milkdown as the Markdown editor component

- Status: Accepted
- Date: 2026-09-03

## Context

Folio needs a pleasant editing experience (ADR-0005) without building a complete Markdown editor from scratch. A Logseq-like editor requires solving cursor behavior, selection handling, undo/redo, keyboard shortcuts, Markdown parsing, formatting commands, clipboard handling, rich text rendering, and serialization — complex problems unrelated to the application's core value (ADR-0006). Markdown files must remain the source of truth (ADR-0001).

## Decision

Use **Milkdown** as the core Markdown editing component. It provides a WYSIWYG Markdown editing experience while keeping Markdown as the underlying document format:

```text
Markdown file → Milkdown editor → user edits visually → Markdown serialization → save back to .md file
```

The editor handles text editing, Markdown rendering, formatting, lists, links, code blocks, tables, and extensions. The application remains responsible for knowledge-management features (storage, vault management, wikilinks, backlinks, journals, search).

Do **not** build a custom editor. Extend Milkdown with custom nodes where needed (e.g., a clickable `[[wikilink]]` node whose underlying file content stays plain Markdown).

This updates ADR-0007: Milkdown replaces `react-markdown` + `remark-gfm` as the primary editing/rendering surface.

## Consequences

- We get a production-quality editor without owning hard text-editing problems.
- The team focuses effort on the differentiating layer: filesystem, vault index, wikilinks, backlinks, journals, search.
- Adds a substantial dependency; the editor is an implementable detail replaceable through the boundary in ADR-0010.
- Markdown round-trips through the editor: files the app parses and files the editor writes must use the same Markdown conventions.