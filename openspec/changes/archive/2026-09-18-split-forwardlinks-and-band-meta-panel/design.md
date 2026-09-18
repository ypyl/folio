## Context

See `proposal.md` for why. What the design has to work with:

- `MetaPanel` (`src/components/MetaPanel.tsx`) takes `backlinks`/`forwardlinks` as `LinkRow[]`, sorts each list case-insensitively, and renders both through one `LinkList`. A row's `kind: 'page' | 'asset'` decides navigate vs open; only `Forwardlinks` can hold asset rows today.
- `App` builds one `forwardlinkRows` memo (`[graph, page]`) that concatenates page rows with `pageAssets(page, graph)` rows labelled by `assetName(path)`. The memo does not re-run while typing, and that must not change.
- `Accordion` already accepts a class on the `<details>` and on its body, so a section can be sized and given its own scroll body without new props.
- The sidebar is a column of bands (add-asset-navigation, D5): `.section` is `flex: 1 1 0` with a 120px floor while open, `.fillBody` and `.scrollBody` give each listing its own scroll region, and collapsed sections are exactly their summary row. Its *windowing* (`windowPieces`, `ResizeObserver`) exists because its lists scale with the vault, not because of the band layout.
- The panel's keyboard-shortcuts section is a `margin-top: auto; position: sticky; bottom: 0` footer with no scroll region of its own, pinned by the ui-shell requirement.

## Goals / Non-Goals

**Goals:**
- Forwardlinks means pages; References means the page's files; each section's empty state matches its own list.
- The panel's link sections behave like the sidebar's bands (own scroll body, floor, one-row collapsed), and the panel scrolls only as a fallback.
- No new work on the keystroke path and no new measurement machinery.

**Non-Goals:**
- No windowing, spacers, or `ResizeObserver` in the panel: its row count is the open page's own link and asset counts, which do not grow with the vault.
- No shared band CSS module and no change to `Sidebar` (see D3).
- No change to `Accordion`'s API, to row resolution outside the panel, or to `assetName`'s labelling.

## Decisions

### D1. The split happens where the rows are built

`App` keeps two memos on the same `[graph, page]` dependencies: `forwardlinkRows` (pages only, no `pageAssets` concat) and `referenceRows` (the `pageAssets(page, graph)` rows). `MetaPanel` gains a `references: LinkRow[]` prop next to `backlinks`/`forwardlinks`.

Why not one list partitioned inside `MetaPanel`: the panel would have to know that a mixed list splits, and its per-section empty copy would still need to know which rows belong to which heading. Three props make the section contract explicit, match how Backlinks/Forwardlinks are already passed, and keep the panel layout-only.

Rejected: filtering in `MetaPanel` by `kind` (smaller diff, hidden coupling, and the "References is empty" copy would have to be derived there anyway).

### D2. Row kind is a property of the section, not the row

With one kind per list, `LinkRow` loses `kind`: `backlinks`, `forwardlinks`, and `references` are each single-kind by construction. `LinkList` takes the section's activation handler and a `dim` flag instead of branching per row:

```
LinkList rows, active path, onActivate, { dim: true  }   Backlinks, Forwardlinks
LinkList rows, null,        onActivate, { dim: false }   References
```

`materialized` stays on the row (page rows need it) and asset rows are built with `materialized: true`, which the "never dimmed" requirement already assumes: a row exists only for a file the vault holds. The `data-active`/`aria-current` marking stays page-only.

Rejected: keeping `kind` and passing it through (a field with one possible value per list is a branch that can never fire).

### D3. The band rules are written twice, documented once

`MetaPanel.module.css` gets the panel's own copies of the band rules (`.section`/`.fillBody`/`.scrollBody`, the `::details-content` flex chain, the 120px floor). CSS Modules cannot share a class between `Sidebar.module.css` and `MetaPanel.module.css` without either a shared module or global classes, and the sidebar's rules carry comments tied to its windowing and its ResizeObserver that do not apply here.

`DESIGN.md` gains the rule once, for both panes: a pane may be a column of bands; while open, a band shares the leftover height with a floor; a listing scrolls in its own body. That is the design language statement; the two CSS files are its two implementations.

Rejected: extracting a shared `panelBands.module.css` (a cross-pane refactor of a component whose prop identity is load-bearing for the typing budget) and global classes (the panel and the sidebar are separate surfaces; a global band class would let either drift without a compiler complaint).

### D4. The shortcuts footer does not change

The three link sections claim `flex: 1 1 0`, so the footer's `margin-top: auto` has nothing left to claim and the summary sits on the panel's bottom edge by layout. `position: sticky; bottom: 0` and `flex-shrink: 0` stay: they are what keeps the summary pinned when the open reference makes the panel overflow, which the ui-shell requirement still requires.

Rejected: making the reference a fourth band. It would give the open reference its own scroll region, which the same requirement forbids, and it would cap a list the user opens deliberately and reads top to bottom.

### D5. One floor, the same number as the sidebar

Each open link section gets `min-height: 120px`, matching the sidebar's `.section[open]` floor, and `overflow-y: auto` stays on the panel as the fallback when even the floors do not fit. Using the same number keeps the two panes' degradation identical: a short window squeezes both until their floors hold, then the pane scrolls.

### D6. Nothing new on the keystroke path, and nothing new to measure

No `ResizeObserver`, no `windowPieces`, no spacers: a section's rows are the open page's own links, bounded by the page, not by the vault, so the row count in the document is what it is today. The two memos keep `[graph, page]`, `handleOpenAsset` is already a `useCallback`, and `MetaPanel` is not memoized today, so the panel's re-render behaviour while typing is unchanged (the sidebar's memo test is unaffected: `Sidebar` is not touched).

## Measurements

Harness: `npm run dev:test` (Vite, OS-picked port — the log must say `ready in`), Chromium through `playwright-cli`, an OPFS-backed vault installed with a `showDirectoryPicker` override, 1280×720, then `npm run kill:dev`. Facts to record in `PLAN.md`:

1. The three bands share the panel and the panel itself shows no scrollbar (`scrollHeight == clientHeight`) with References open; a page with more backlinks than fit scrolls only the Backlinks body.
2. A collapsed section is exactly its summary row (the same 37px the sidebar's collapsed sections measure), and opening References takes its height from Backlinks/Forwardlinks rather than from the panel.
3. The collapsed shortcuts summary stays on the panel's bottom edge in every combination of open/closed link sections, and opening it grows the list upward with the panel as the only fallback scroll region.
4. The short-window fallback: at ~420px tall the sections hold their 120px floors and the panel scrolls.
5. Row counts and the keystroke budget are asserted in jsdom (`MetaPanel.test.tsx`, and the existing sidebar memo test), where they run on every change.

## Risks / Trade-offs

- [Three open sections in a short panel each get very little height] → the 120px floors plus the panel's own scrollbar as the documented degradation path, the same behaviour the sidebar already ships.
- ["References" collides with ADR-0012's "page references"] → the section is requested by name and holds files; every spec that mentions it says what it holds, and the panel's accessible name still describes the panel rather than one list.
- [References collapsed by default hides a page's files behind a click] → deliberate: it mirrors the sidebar's Assets section and keeps the panel looking as it does today for a reader who never opens a page's files.
- [A `MetaPanel` prop that is rebuilt per render would re-render the panel while typing] → the panel is not memoized, so there is no bail-out to defeat; the two row arrays come from `useMemo`s on `[graph, page]`, so typing allocates nothing new.
- [Removing `LinkRow.kind` touches existing tests] → those tests are updated in the same task that changes the props; they assert labels and activation, not the field.

## Migration Plan

None needed. Every changed value is derived in memory on open (ADR-0001/0004); nothing new is persisted, no storage operation is added, and no on-disk format changes. `package.json` goes 0.10.0 → 0.11.0 (a new user-facing section), and `PLAN.md` gains a numbered task entry.

## Open Questions

None: the layout numbers (floor height, whether the panel needs a cap) are settled while styling against `DESIGN.md` and change no requirement or task.
