# Proposal

## Why

Search returns every kind of match in one fixed order — Pages, Journal, Boards,
Files — so a reader who knows they want a board, a file, or a name match has no
way to say so. The ranking already knows the difference; the query cannot express
it. Five short operators let the reader promote the kind or the field they care
about, without filters, without a new syntax to learn beyond the operator word,
and without changing what matches.

## What Changes

- Search recognizes five operator tokens — `page:`, `journal:`, `board:`,
  `assets:`, `title:` — each of which reorders results so the relevant matches
  lead. Matching itself is unchanged: every remaining word is an ordinary search
  term, and every term still has to match.
- `page:`, `journal:`, `board:`, and `assets:` promote one kind. The promoted
  kind's group moves to the top of the dropdown and the results view, above the
  other groups, which keep their usual order. No result is hidden: a promoted
  kind is a reorder, not a filter.
- `title:` promotes matches in a name rather than in content. It renders a
  "Names" section first, holding every page, journal day, board, and file whose
  match is in its title or name, followed by the usual kind groups for the
  content-only matches.
- An operator is any whitespace-separated token that starts with one of the five
  operator words followed by `:`, compared case-insensitively. Text after the
  colon is an ordinary search term, so `board:meeting` means "promote boards,
  and match `meeting`"; a bare `board:` promotes with no extra term.
- One operator per query: the first operator token wins, and any later operator
  token is ignored (stripped, not matched).
- An empty query deploys a discoverability list of the five operators instead of
  nothing. Each row shows an icon, a label, and a one-line description; choosing
  one inserts its token into the input and keeps the caret there to finish the
  query.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `search`: the query gains five ordering operators, an empty query deploys an
  operator list, and the results surfaces order groups by the active operator.
  Matching, ranking tiers, snippets, caps, and the results view are otherwise
  unchanged.

## Non-goals

- No filtering. An operator never hides a result; it only moves matches up. The
  full match set stays reachable.
- No value syntax. Operators are bare reorders; the text after the colon is a
  normal search term, not a field selector. `board:meeting` does not restrict the
  Boards group to boards named "meeting".
- No new search index, scoring model, backend, or dependency. Operators are a
  reorder over the results the in-memory index already produces (ADR-0001,
  ADR-0004).
- No Mantine or other UI library. The operator rows reuse Folio's existing CSS
  and Kami tokens (ADR-0011); the Mantine spotlight is a layout reference only.
- No syntax highlighting, chips, or other chrome in the search input. The input
  stays a plain text field; operators are text.
- No change to what matches: titles, content, board names, and file names are
  read exactly as they are today, and board drawings and file contents are still
  never read (ADR-0022).
- No `.folio/` or on-disk change. Search reads only the index already in memory.

## Impact

- Code: `src/search/core.ts` (operator parsing, result ordering, the operator
  catalogue), `src/components/SearchSpotlight.tsx` (the empty-query operator
  list, activation, keyboard navigation over it), and
  `src/components/SearchResultsView.tsx` (group order under an operator).
- Styles: `SearchSpotlight.module.css` gains the icon-plus-label-plus-description
  row shape, using Kami tokens from `DESIGN.md`.
- Tests: `src/search/core.test.ts` and the spotlight and results-view test files.
- Spec: `openspec/specs/search/spec.md`, several requirements.
- No VaultStorage, filesystem, or storage change. No ADR needed: this refines
  search ordering and adds no architectural decision (the search layer stays pure
  math over the in-memory index; ADR-0003, ADR-0010).
