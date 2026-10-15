# Design

## Context

See proposal.md — Why. The search layer is pure math over the in-memory index
(`src/search/core.ts`): `searchDocs` returns one ranked, flat list of
`SearchResult`s, and each surface groups that list by `kind` with a hard-coded
order. `SearchResult` carries `ranges` for the body but drops the ranking flags
(`AccFlags`) before returning, so nothing today records whether the *title*
matched.

Operators are a reorder over that existing list, so the work is parsing the
query, exposing the one missing flag, and centralising the group order that both
surfaces currently duplicate. Matching, tiers, snippets, and caps are untouched.

## Goals / Non-Goals

**Goals:**

- Parse the operator out of the query once, in `core.ts`, and hand both surfaces
  the same ordered sections.
- Keep every existing result, ranking, and truncation rule intact.
- Add no derived state and nothing new on the typing path.

**Non-Goals:**

- No filtering, value syntax, or new match source (see proposal Non-goals).
- No change to the Fuse config, the AND-term model, or `searchDocs` ranking.

## Decisions

### Parse in core, order in core

Add `parseQuery(query): { operator: SearchOperator | null; terms: string[] }`.
It walks the whitespace tokens once; the first token that starts with one of the
five operator words plus `:` becomes the operator (case-insensitively), and its
remainder after the colon joins `terms` if non-empty. Any later operator-looking
token is dropped from `terms` without becoming an operator. `searchDocs` keeps
its signature and calls `parseQuery` internally, so matching needs no other
change.

Alternatives: parsing in the component would split the query rules across
layers and duplicate the token walk in two surfaces; a regex over the whole
query would add a per-query allocation the token loop does not.

### Expose `matchedTitle` on the result

`AccFlags` already tracks a title hit only as `_titleExact` (every term matched
the title). `title:` needs "did the title match at all", so add `_titleHit`, set
whenever a term matches the title (exact, whole-word, or fuzzy), and surface it
as `matchedTitle: boolean` on `SearchResult`. This is the only new field; the
existing `_titleExact` / `_bodyExact` / `_titleFuzzy` ranking is unchanged.

### One section builder for both surfaces

Replace the duplicated per-surface grouping with
`sectionsOf(results, operator): { label: string; items: SearchResult[] }[]` in
`core.ts`:

- default: Pages, Journal, Boards, Files;
- a kind operator: that kind first, the rest in default order;
- `title:`: a `Names` group holding every `matchedTitle` result (any kind) first,
  then the kind groups for the remaining content-only matches.

`SearchSpotlight` and `SearchResultsView` both render what this returns, so the
operator cannot drift between the dropdown and the results view. The empty
groups are dropped as they are today.

Alternative: reorder the flat list in core and let each surface regroup by
`kind`. Rejected: `title:` is not a kind, so the surface would still need its own
"Names" branch, which is the duplication this removes.

### Empty query renders an operator catalogue

Add `SEARCH_OPERATORS: { id, token, label, description, icon }[]` to `core.ts`
(the single source for tokens and copy). The spotlight, when the query is empty,
renders these rows through the same list and `listKeyDown` navigation it already
uses, with the same active-row handling. Choosing a row sets the query to
`token + ' '` and refocuses the input; the run that follows is an empty-query run
again, which is exactly the state the user is now editing past. `results` stays
`null` for the empty query, so the results dropdown and the operator list never
render together.

Alternative: a separate React list and keyboard handler for the operators.
Rejected: it duplicates `listKeyDown` and the active-row state for five static
rows.

### Icons and style

Inline SVGs in the existing icon style (no icon dependency), styled with Kami
tokens from `DESIGN.md`. The Mantine spotlight is a layout reference; adding
Mantine would violate keep-it-small (ADR-0006).

## Risks / Trade-offs

- **A literal term that looks like an operator (`board:room`) is always the
  operator.** Mitigation: accepted; the operator is discoverable, and no vault
  content uses that shape as a term today. Documented in the spec.
- **`title:` matches by name only, so it can empty the Names section.** The
  `sectionsOf` builder drops the empty group and shows the usual groups, so a
  `title:` query with no name match degrades to a normal search.
- **Cost.** Parsing is one pass over the query's tokens, and `sectionsOf` is one
  pass over results already in memory — the same order as the grouping the
  surfaces do today. Both run inside the existing 120 ms debounce, never on the
  keystroke path, and allocate only the section arrays they return. No index, no
  filesystem read (ADR-0001, ADR-0004).
- **Group order is now data, not a constant.** Two surfaces read one builder, so
  a future kind or operator changes in one place; the existing "the results view
  matches the dropdown" rule keeps them honest.

## Migration Plan

None. No on-disk format, no persisted state; the change is code-only and takes
effect on reload, with the usual patch version bump.
