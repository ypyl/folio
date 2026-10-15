# Tasks

## 1. Operator parsing in the core

- [x] 1.1 Add the `SearchOperator` type and `SEARCH_OPERATORS` catalogue
  (`id`, `token`, `label`, `description`, `icon`) to `src/search/core.ts`;
  verify the five tokens match the spec copy
- [x] 1.2 Add `parseQuery(query)` returning `{ operator, terms }` — the first
  token beginning with an operator word plus `:` is the operator
  (case-insensitive), its remainder joins `terms` when non-empty, later
  operator tokens are dropped, everything else stays a term; verify with
  `core.test.ts` cases for bare operators, `board:meeting`, `Board:`, first-wins,
  and operator-alone
- [x] 1.3 Make `searchDocs` use `parseQuery(query).terms`; verify existing
  matching tests still pass and `board:meeting` matches on `meeting` alone

## 2. Name matches and sections in the core

- [x] 2.1 Track `_titleHit` in `searchDocs` (any term matching the title,
  exact, whole-word, or fuzzy) and expose `matchedTitle` on `SearchResult`;
  verify with a case where a result matches both title and body, and one that
  matches only the body
- [x] 2.2 Add `sectionsOf(results, operator)` returning labelled groups: default
  order, promoted-kind-first order, and the `title:` `Names` group followed by
  the content-only kind groups, dropping empty groups; verify each shape in
  `core.test.ts`

## 3. The spotlight operator list

- [x] 3.1 Render the `SEARCH_OPERATORS` rows when the query is empty (icon,
  label, description), sharing `listKeyDown` and the active-row state with the
  results list; verify the dropdown deploys with five rows in
  `SearchSpotlight.test.tsx`
- [x] 3.2 Choosing a row inserts `token + ' '`, refocuses the input, and keeps
  the caret after the space; verify the input value and focus in
  `SearchSpotlight.test.tsx`
- [x] 3.3 Render the dropdown from `sectionsOf` instead of the hard-coded kind
  order; verify a promoted group leads in `SearchSpotlight.test.tsx`

## 4. The results view follows the operator

- [x] 4.1 Render the results view from `sectionsOf` so the promoted group and
  the `title:` `Names` section match the dropdown; verify with a promoted-kind
  case and a `title:` case in the results-view tests

## 5. Styles

- [x] 5.1 Style the operator row (icon, label, description) in
  `SearchSpotlight.module.css` using Kami tokens from `DESIGN.md`; verify
  visually in the browser against a vault, with `npx oxlint --fix` and
  `npm run fmt` clean

## 6. Integration and verification

- [x] 6.1 Bump `version` in `package.json` (minor: a new user-facing
  capability) and confirm the status bar shows the new `v<version>`
- [x] 6.2 Run `npx oxlint --fix`, `npm run fmt`, then
  `npx oxlint --deny-warnings --format=agent`; confirm clean
- [x] 6.3 Run `npm test` (all projects) and `npx tsc -b`; confirm pass
- [x] 6.4 In a real browser against a vault, confirm an empty query lists the
  five operators, choosing one inserts its token, and `board:`, `assets:`, and
  `title:` reorder the dropdown and the results view as specified — run the
  dev server with `npm run dev:test` and sweep it with `npm run kill:dev`

## Workflow follow-up

- Archive the change after review, noting what shipped and what was verified.
- No ADR update: the change adds no architectural decision (search stays pure
  math over the in-memory index).
