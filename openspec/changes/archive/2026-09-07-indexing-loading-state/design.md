# indexing-loading-state — Design

## Context

See `proposal.md` — Why. The wait happens in `buildIndex` (`src/vault/index.ts`): a recursive `storage.list('')`, then a serial `stat` + `read` + parse per `.md` file. While it runs, `useIndex` holds `graph === null` and `App.tsx` renders empty-ish panes: the sidebar gets `hasVault={false}` (no calendar, no rows), the editor pane shows the "Your notes appear here." hint (`emptyHint === 'notes'`), the header still shows the real folder name and open-time count, and search is disabled. The loading state is purely presentational: it surfaces an already-observable wait without touching the index machinery.

## Goals / Non-Goals

**Goals:**
- Panes that derive from the index show Kami-styled placeholders from the moment a folder is active and its graph is empty until the graph resolves.
- Accessible: `role="status"` label "Indexing notes…" announced once per build; placeholders are decorative.

**Non-Goals:**
- No progress reporting (requires instrumenting `buildIndex` — follow-up if the wait stays painful).
- No change to `useIndex`/`useVault` state machines, the refresh cycle, or indexing performance.
- No spinner; a subtle opacity pulse is the only motion.

## Decisions

**D1 — Derive the loading state, don't add one.** `indexing = graph === null && activeFolder?.storage !== undefined`. `graph` is already null exactly while a folder's index builds (a folder switch nulls it in the same render via the storage-tagged `built`), and `undefined` storage excludes the no-folder and pending-permission cases. No new state in `useVault`/`useIndex`.
- Alternative: expose `indexing` from `useIndex` — rejected; `graph === null` already encodes it and a second source of truth can desync.

**D2 — Thread a `loading` prop, keeping the components vault-free** (existing design decision 3: components never import the vault).
- `Sidebar({ loading })`: when true, render a few skeleton rows inside the Journal and Pages sections instead of the calendar/list (`aria-hidden`, decorative). The existing `hasVault` gate stays for real content.
- `EditorPane({ loading })`: when true, render skeleton body lines in place of the `emptyHint` content, plus a muted "Indexing notes…" caption carrying `role="status"` (announces in-progress; the caption is also honest visible copy). Header and search are untouched.
- `MetaPanel({ loading })`: when true, render skeleton rows in the Backlinks and Forwardlinks sections in place of both the placeholder copy and the link lists.

**D3 — One shared skeleton style, Kami tokens only.** A single `.skeleton` placeholder class in `src/index.css`: warm-gray fill (`--warm-sand`), `8px` radius, `4px`-grid vertical rhythm, and a subtle opacity pulse (`@keyframes`, ~1.2s). No brand accent, no gradients, no shadows (Kami rules). EditorPane and Sidebar both use it; one definition beats two near-copies.

## Risks / Trade-offs

- [Skeleton flashes on tiny, near-instant builds (folder switch to a small vault)] → The state still renders for a frame; a minimum-display timer is over-engineering and would delay real content. Accept.
- [`role="status"` re-announces on every switch] → Switches are rare and polite live regions announce content changes; acceptable, and exactly what the spec asks for.
- [Skeleton shows during a stale-permission window] → A pending-permission folder has no `storage`, so `indexing` stays false until re-grant lands; that window already shows pre-existing empty content, unchanged by this change.

## Migration Plan

Not applicable — new UI state with no persistence. Rollback is reverting the prop/class changes; no ADR or spec archive implications beyond the normal flow.