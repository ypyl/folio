## Context

See proposal.md — Why. The active folder's graph (`useIndex`) is the source of page content; drafts (`DraftStore`) are session-scoped and cleared on folder switch; `pendingBlank` in `App` already renders a path with no file as a blank page that materializes on first save. Today the app boots to an empty pane even with a vault open, and the sidebar's New Page button is inert.

## Goals / Non-Goals

**Goals:**

- Land on today's journal whenever a folder is active and nothing is open, without ever creating a file by merely opening.
- Empty pages visibly invite typing, with no change to what is saved to disk.
- Remove the New Page button with no replacement affordance.

**Non-Goals:**

- No persisted "last open page"; the today journal is the only default landing.
- No new page-creation UI (references/calendar already create pages).
- No changes to drafts, save, index, or filesystem logic beyond the auto-open glue.

## Decisions

**D1 — Auto-open lives in an `App` effect keyed on `[graph, activePath]`.**

When the active folder's graph is built and `activePath` is null, set `activePath` to `journals/${localDayString(new Date())}.md` and seed its draft exactly like `handleSelect` does (`drafts.open(path, graph.pages.get(path)?.content ?? '')`).

Why wait for the graph instead of opening when the folder activates? `useIndex` returns `graph = null` the instant storage changes, so the effect can only fire with the right folder's graph — no stale/cross-folder content. Opening before the index built would seed the today draft from nothing; since a draft wins over index content, an existing today file could end up masked (blank) once the index lands. Waiting makes the seed always correct.

Coverage falls out of the guard: boot restore, folder switch, and folder add all end with `activePath === null` and a freshly built graph → today's note opens. Re-activating the already-active folder keeps `activePath` non-null → effect no-ops → the open page is preserved (existing re-grant behavior). The brief empty pane while a folder's index builds is the pre-existing accepted restore behavior (`emptyHint: 'notes'`), not a regression.

One guard gap surfaced in apply: `addFolder` (`openNewFolder`) resolves asynchronously, so between `activePath` being nulled and the new folder becoming active, the effect could steal the old folder's graph and seed the old folder's today path — which then never re-opens for the new folder (draft cleared, pendingBlank needs one). Fixed with a third small effect keyed on `activeFolder?.id` that resets `activePath`/`lastKnown`/search on every folder identity change, restoring the invariant "an open page never outlives its folder" for all switch paths (rail, add, dedup).

**D2 — Auto-open reuses the unmaterialized-page path unchanged.**

`pendingBlank` keys on `openDraft.saved === ''`, which the `drafts.open(..., '')` seed produces for a day with no file. Blank-today behavior (first save materializes, indicator reads "New page: created on first save") is identical to clicking a fenceless calendar day — no new bookkeeping.

**D3 — Placeholder is EditorPane state + CSS, not a Milkdown plugin.**

`EditorPane` tracks emptiness locally: `useState(initialContent.trim() === '')`, updated on every `onChange` (`markdown.trim() === ''`), reflected as a `data-empty` attribute on its mount element — the editor layer (ADR-0010). CSS then shows the copy on the first line:

```css
.editor[data-empty] :global(.ProseMirror) :global(p:first-child)::before {
  content: var(--placeholder);
  float: left; height: 0; pointer-events: none;
  color: var(--stone);
}
```

The copy is delivered through the inheriting `--placeholder` custom property, set inline by the pane, because `content: attr(data-placeholder)` would resolve against the `::before`'s own element — the empty `<p>`, which Milkdown owns. Ancestor attributes never resolve; a custom property does (and inherits).

An empty doc is always exactly one empty paragraph (ProseMirror guarantees a top-level block and collapses leading blanks), so `p:first-child` under `data-empty` is unambiguous — the placeholder lands on the cursor line and scrolls with the document. `float: left; height: 0` keeps it out of layout and selection (the standard Tiptap/ProseMirror trick); it is CSS-only, so it never reaches the markdown or the file.

Alternatives rejected: pure-CSS `:empty` — fails because the empty paragraph contains `<br class="ProseMirror-trailingBreak">`; a Milkdown placeholder plugin — none ships in the installed plugin set, and this needs no dependency; rendering the placeholder as a separate absolutely-positioned element — fights the pane's scroll and line metrics.

**D4 — Sidebar button removal is pure deletion.**

Drop the button and its `.newPageBtn` CSS. Page creation already exists via `#word`/`#[[Page]]` references (unmaterialized forwardlinks) and calendar days — nothing to replace.

## Risks / Trade-offs

- [One-frame empty pane while an index builds, once per folder open] → Pre-existing restore behavior (`emptyHint: 'notes'`); the effect fires on the first render that has a graph, so the window is unchanged by this change.
- [Tests depend on the wall-clock date (`localDayString`) — fixture days are 2026-09-02..04, "today" is real] → Folder-open tests assert the blank *today* editor (seeded `''`, placeholder visible) instead of the old empty-state copy; the existing journal-write test already uses real today.
- [StrictMode double-invokes effects in dev] → `drafts.open` is idempotent and the guard (`activePath !== null`) makes the second run a no-op.
- [Placeholder could render on the leading empty paragraph of a contentful doc] → Imposible: `data-empty` only fires for fully-empty docs, where the sole paragraph is the one.

## Migration Plan

None — client-only UI change, no data or persistence. Rollback is the reverse diff.

## Open Questions

None.