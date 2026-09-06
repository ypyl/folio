# Links Pane — Design

## Context

The index (ADR-0004) already produces everything the pane needs: `Graph.backlinks: Map<lowercased target name, path[]>` (reverse references, self-links excluded per the vault-index spec) and per-page `links: Link[]` (outgoing targets, unique per file, each with its lexical `via` form). `byName: Map<lowercased name, path>` resolves a reference target to a real page path. The MetaPanel component already renders the two Accordion sections with placeholder copy; sidebar rows, row styling, `aria-current` marking, and the `onSelect(path)` navigation seam all exist and are reused. Nothing about storage changes: `VaultStorage.write` already creates parent directories and the file (fs.ts), which is the materialize-on-first-save mechanism.

## Decisions

- **D1 — Data stays in the graph; the pane is a pure projection.** No index change. App resolves, MetaPanel renders plain row props. Backlinks for the open page: `graph.backlinks.get(page.title.toLowerCase())`, resolved to titles via `graph.pages`. Forwardlinks: each `page.links[].target` resolved through `byName`; a miss means the target is unmaterialized.
- **D2 — Unmaterialized pages keep the navigate-to-blank contract.** The open-page state in App already falls back through `drafts` for content and `upsertPage`/`storage.write` for saves. Add a `pending: Set<string>` of paths this session opened with no file; `displayed` consults it: a pending path with no graph page renders an empty IndexPage (path + stem title, blank content) instead of the null/empty state. Removing a path from `pending` the moment its file materializes (first successful save) keeps the set small; a folder switch clears it (drafts already clear then).
- **D3 — First-save wording via the existing save indicator.** `SaveIndicator` already distinguishes states; a pending page's dirty state is labelled "New page — created on first save" (save indicator spec scenario). Clean (empty) pendings show no indicator — nothing to save, nothing created.
- **D4 — Dimmed unmaterialized rows.** Rows resolve to a `pending`/missing path get a muted style class (Kami token text-muted), same row component, still a button. The open page's own row uses `aria-current` like the sidebar.
- **D5 — Sort and display.** Alphabetical, case-insensitive, by title. Backlinks list the *referring pages'* titles; forwardlinks list the *referenced names* — displayed as the target's title when the page exists, otherwise the reference name (matched, not normalized to file case).
- **D6 — Components stay prop-driven (design decision 3).** MetaPanel receives `activeName`, `backlinks: Page[]`, `forwardlinks: Page[]` (or a lightweight `{ path, title, materialized }` row type shared with the sidebar's `Page`), and `onSelect`. It never imports the vault.
- **D7 — Journals are ordinary pages.** A journal entry's links and backlinks work identically; no special casing.

## Risks

- **Pending-page leak**: forgetting to clear a `pending` path could render a phantom blank page after its file vanishes externally. Mitigated by D2's clear-on-materialize + clear-on-folder-switch, and pending only ever *widens* what navigation can open.
- **Duplicate resolution logic**: backlinks via `backlinks` map, forwardlinks via `byName` — two map keys (name lowercased vs path). Both already tested by the vault-index spec; the pane only reads, so risk is display-side only.
- **Indicator wording expectations**: D3's new-page label is a behavior change visible in tests; scenario is captured in the static-navigation delta.

## Out of Scope

Unlinked references (plain-text mentions without link tokens) are parked in PLAN "Later ideas" (D2 of exploration). Page *creation* UI beyond navigate-to-blank remains parked (`page-creation`); this change deliberately does not add a create button or rename flows.