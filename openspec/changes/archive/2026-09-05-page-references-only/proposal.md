## Why

Folio's docs, mock data, and the throwaway preview renderer still talk about "tags" as a thing and still treat plain `[[Page]]` wikilinks as a reference form. The only real concept is a page reference, and it has exactly two spellings: `#word` and `#[[Many words]]`. Keeping the `[[Page]]` form and "tags" language adds concept clutter to the parser, index, and specs without adding value (ADR-0012, ADR-0006).

## What Changes

- **BREAKING — Reference grammar narrows to two forms:** page references are written only as `#word` (single word: letters, digits, `_`, `-`) or `#[[Many words]]` (bracketed multi-word). Plain `[[Page]]` is no longer a reference form.
- `[[Page]]` no longer renders as a chip in the preview; it falls through as literal Markdown text.
- All "tags"-as-a-concept language is removed from docs, specs, mock data, and code. "Tag" words are page references (`#word`), not labels.
- The `--tag-bg` design token is renamed to a neutral chip token; the DESIGN.md "Tags / badges" section becomes "References / chips".
- Docs updated: AGENTS.md, README.md, PLAN.md task 6, adr/0004, adr/0012.

## Capabilities

### New Capabilities
- `page-references`: the canonical reference model — one page namespace, exactly two lexical forms (`#word`, `#[[Page]]`), no tags concept, references to not-yet-existing pages are valid.

### Modified Capabilities
- `static-navigation`: the micro-renderer chips `#word` and `#[[Page]]` references; plain `[[Page]]` renders as text and is not a chip.

## Impact

- `src/components/MarkdownPreview.tsx` — reference regex drops the `[[...]]` alternative; comments stop saying "tag chips".
- `src/components/MarkdownPreview.test.tsx` — renamed cases, added `#[[...]]` and plain-`[[Page]]`-is-text cases.
- `src/mockVault.ts` — all `[[...]]` links rewritten to `#word`/`#[[...]]` form; "Tagged #architecture." and "A #tag is…" prose reworded; one multi-word example added.
- `src/index.css`, `src/components/MarkdownPreview.module.css` — `--tag-bg` → `--chip-bg`.
- Docs/specs: ADR-0004 (Link shape), ADR-0012 (two lexical forms), AGENTS.md, README.md, PLAN.md. `research/` notes are left untouched (historical records).
- No parser/index implementation yet (that is plan task 6, still pending; only its wording changes here).

## Non-goals

- No tags UI, tag index, or tag-vs-page distinction anywhere.
- No implementation of the scan/parse/index step (plan task 6) — behavior specs only; the renderer behavior is what changes on disk now.
- No Milkdown editor work; the editor will consume the same two-form grammar later (ADR-0008).
- No escape syntax for references (`\#word`) — not requested, not needed yet.
- No changes to search (Fuse.js), backlinks semantics, or the vault-storage layer.
- No rewriting of `research/` discussion records.