## Context

See `proposal.md` for why. What the design has to work with:

- `buildIndex` (`src/vault/index.ts`) already calls `storage.list('')`, which returns **every** file in the vault, then discards everything `isPagePath` rejects. The asset inventory is therefore already in hand; nothing new is read.
- `parseLinks` (`src/vault/parse.ts`) extracts `#word` / `#[[Page]]` references and is a pure function of content — never IO, never on a keystroke. Asset references are the same shape of data from a different syntax, so they belong beside it.
- The Pages listing is windowed by `windowPieces` from a single measured scroll container (`scrollRef` = the `<aside>`), and the Sidebar is memoized against a documented list of referentially-stable props (`src/components/Sidebar.tsx`).
- `openVaultTarget` (`src/editor/assetTarget.ts`) already implements ADR-0021's two branches; the editor reaches it through the `readAsset` prop.
- `Accordion` is shared by Sidebar and MetaPanel and renders `<details>`; `<details>` keeps its children mounted when collapsed.

## Goals / Non-Goals

- Goal: assets become first-class for *listing* and *opening* without becoming pages (ADR-0022), and the sidebar stops burying its lower sections.
- Non-goal (design-level): no asset metadata (size, type, dates), no asset backlinks, no third windowed list, no change to how the editor resolves images.

## Decisions

### D1. Existence is filtered where rows are built, not at scan time

`IndexPage.assets` holds **candidates** — the vault-relative destinations the page's Markdown names, ordered and deduped, restricted only by `isVaultRelative` plus "not a page". Existence is checked against `Graph.files` (the non-hidden file listing) when Forwardlinks rows are built.

Why: a page is carried over on refresh when its mtime is unchanged, but the *folder* can change under it. Filtering at scan time would keep reporting a deleted asset until the page itself was edited; filtering against the current `files` set drops it on the next scan. The parse is a pure function of content (which the mtime snapshot tracks) and existence is a property of the folder (which the listing tracks), so they are stored where each changes.

Alternative rejected: filtering inside `buildIndex`. Simpler by one line, wrong after any external delete.

### D2. The folder listing is the existence substrate

`Graph.files: Set<string>` is every non-hidden path from the same `list('')` call; `Graph.assets: string[]` is its sorted `assets/`-prefixed subset. No second snapshot, no per-asset `stat`, no asset byte reads. The "what is an asset" rule (the `assets/` prefix, hidden-segment exclusion, path ordering) stays in the vault layer so `App` reads `graph.assets` and nothing else.

Cost accounting (AGENTS.md: what does this add to the keystroke path, and what does it scale with?): keystroke path untouched — `page.assets` is a carried value and the Forwardlinks memo keeps its `[graph, page]` dependencies. A scan adds one regex pass per page *read*; a refresh adds one O(N) derive over a listing it already fetched.

### D3. Destination extraction: a scanner, not a regex

`parseAssetPaths(content)` walks each `](` occurrence, scans to the matching `)` with a depth counter (so `assets/a (draft).pdf` survives), unwraps `<...>`, strips a trailing *quoted* title, then percent-decodes with the raw string as fallback, and keeps the destination when `isVaultRelative` accepts it.

Alternatives rejected: a single regex (cannot handle balanced parens or titles), and case-insensitive matching against the listing (a case-insensitive filesystem and a case-sensitive one disagree, and Folio's own drop flow always writes the exact path it links).

Accepted limits, matching existing behaviour rather than fixing it here: destinations inside fenced or inline code are still captured (as `parseLinks` already captures `#tag` in code), and reference-style links, raw HTML `<img src>`, autolinks, and paren-form titles are not captured.

### D4. One open behavior, two entry points

`src/editor/assetTarget.ts` becomes `src/vault/assetOpen.ts` (the editor → vault direction already exists: `inlineDecorations.ts` imports `vault/parse`), split as:

```
   openVaultTarget(href, read, openers)   classify an href, then delegate
        v
   openVaultPath(path, read, openers)     the path is already true: no decoding
```

Why not one function: a Markdown destination is a URL and may be percent-encoded (`assets/my%20file.pdf` means the file with a space), while a path from the folder listing is the file's literal name and must not be decoded at all. A single entry point either breaks `assets/100% done.pdf` or mis-resolves `assets/a%20b.pdf`. `isVaultRelative` moves with it, so the index and the open path share one definition of "a vault path".

### D5. The banded sidebar

```
   <aside>            flex column, overflow-y: auto   (fallback when nothing fits)
     controls         flex: 0 0 auto
     Journal details  flex: 0 0 auto     natural height; no internal scroll
     Pages details    flex: 1 1 0 when open, min-height floor
       body           overflow-y: auto   <- scrollRef, the windowing container
     Assets details   flex: 1 1 0 when open, min-height floor, capped body
       body           overflow-y: auto   <- second region
```

`Accordion` gains an opt-in variant (`fill`, `bodyRef`) so MetaPanel keeps today's markup. `measure()` keeps its current shape and simply reads the Pages body instead of the aside; `windowPieces` is unchanged, and asset rows reuse the Pages row style so `ROW_STRIDE` stays correct. The `ResizeObserver` keeps its existing reasoning: it watches the scroll container's own box, whose height is set by flex and whose content height is pinned by spacers, so it cannot feed back into another measure.

Alternatives rejected: keeping one sidebar scroll region with Assets below Pages (the History-section failure from task 23), and pinning the Assets summary with `position: sticky; bottom: 0` (a sticky-bottom `<details>` taller than the pane puts its own summary out of reach).

### D6. Row kind, not row shape

`LinkRow` gains `kind: 'page' | 'asset'`; `MetaPanel` gains `onOpenAsset`. Both lists keep using the same row component, styling, and alphabetical sort, with `kind` choosing navigate vs open and suppressing the dimmed state for assets. `App` owns both handlers, so no component reaches storage.

## Measurements

Harness for the layout numbers: `npm run dev:test` (Vite, OS-picked port), Chromium through `playwright-cli`, an OPFS-backed vault installed with a `showDirectoryPicker` override, 1280×720. The layout is the part jsdom cannot see, so it is the part the browser answered. The row-count numbers at vault scale are asserted in `src/components/Sidebar.test.tsx` instead (10,000 pages and 10,000 assets), where they run on every change.

**1. The bands hold and the pane does not scroll** (400 pages, 20 assets):

| | height | scroll extent |
|---|---|---|
| sidebar pane | 623 | 623 — no pane scrollbar |
| Journal band | 287 | sized to the calendar |
| Pages band | 150 (Assets open) / 262 (collapsed) | — |
| Pages body | 225 → 112 with Assets open | 14,016px = 400 × 35 + 16 padding |
| Assets band | 37 collapsed / 149 open | 716px = 20 × 35 + 16 padding |

**2. The listing re-windows when a band takes its height.** Opening Assets drops the Pages body from 225px to 112px, and the Pages listing goes from **18 rendered rows to 15** in the same frame — the `ResizeObserver` re-measures rather than trusting the old range. The scroll extent is unchanged (14,016px), so the listing lost no reach.

**3. The end of the listing is real.** Scrolling the Pages body to the bottom renders `Note-000` (oldest, last by mtime) at `scrollTop` 13,904 = 14,016 − 112, with 13 rows in the document. Independent open/close holds: collapsing Pages takes it to 38px and hands the height to Assets (261px).

**4. The short-window fallback works.** At 1280×420 the pane's content is 565px against 323px of space: both listings keep their 120px floor and the pane itself scrolls, rather than a band being clipped to nothing.

**5. A collapsed section is one row.** A closed `<details>` still generated its body's 16px padding under `content-visibility: hidden`; `Accordion` now hides a closed body outright, so collapsed sections measure exactly their 37px summary — in the sidebar and in the meta panel, whose shortcuts row settles on the panel's bottom edge.

**6. The open gesture branches as specified.** A listed `.txt` opened a `blob:` window (a second tab) while the app stayed on the same page with the same active row; a listed `.zip` produced a download named `bundle.zip` and **no** tab. Zero console errors and warnings.

**7. Nothing new on the keystroke path.** The keystroke-budget test (the memoized sidebar must not re-render while typing) passes unchanged with the two new props: `assets` is the graph's own array and `handleOpenAsset` reads only the active folder.

## Risks / Trade-offs

- [A short window squeezes the Pages body to zero] → a `min-height` floor on both list bodies, with the `<aside>`'s own scrollbar as the degradation path when even the floors do not fit.
- [Two scroll regions in one pane is a new interaction] → Assets is collapsed by default so the second region only exists when asked for; ui-shell's scroll requirement is restated rather than silently broken.
- [A new Sidebar prop silently defeats the memo while typing] → `assets` comes from `graph` (already stable per scan) and `onOpenAsset` is a `useCallback`; `EMPTY_ASSETS` mirrors `EMPTY_PINS` for the no-graph state. The Sidebar's prop-stability comment block gets the new entries.
- [Sidebar re-renders on every 30-second refresh] → pre-existing (`buildIndex` returns a new graph each scan). Windowing keeps the cost to the visible rows; this change adds no new requirement and claims no improvement.
- [The `assets/` prefix hides files in a vault that keeps images elsewhere] → deliberate (ADR-0022): the pane and the open path still resolve any vault-relative path, and such a file still appears in a page's Forwardlinks.

## Migration Plan

None needed. Everything added is derived in memory and rebuilt on open (ADR-0004); nothing new is persisted, no storage operation is added, and no on-disk format changes. `package.json` goes 0.9.2 → 0.10.0 so the build is distinguishable, and `PLAN.md` gains the task entry plus a revision note on task 23's "the sidebar is still the only scroll region" claim.

## Open Questions

- The exact floor and cap heights for the two list bodies (a row count versus a fraction of the pane). Settled while styling against `DESIGN.md`; it changes no requirement or task.
