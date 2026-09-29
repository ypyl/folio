## Why

The sidebar carries four bands: Journal, Pages, Boards, Assets. Two of them are
permanently empty on most vaults, and a vault's few non-page files are split
across three separate lists competing for the same height. The sections made
sense when boards and assets were envisioned as first-class collections; in
practice a user opens the sidebar to reach a page and rarely looks for a board
or an asset. Three sections for one job is height spent on structure nobody
uses.

## What Changes

- The sidebar becomes **two bands**: Journal (its calendar, unchanged) and
  **Files** (a single new section replacing Pages, Boards, and Assets).
- **BREAKING** The Pages, Boards, and Assets sections are removed. Their rows
  move into the Files listing.
- Files is a single collapsible section, open by default, with **one scroll body
  and one windowed listing** (down from three of each).
- Listing order: pinned pages first in pin order (most recently pinned first),
  then remaining pages by last-modified descending with a path tiebreak, then
  the vault's boards and assets in path order.
- **Kind badges**: page rows are unbadged (the default kind); a board row
  carries a small `b` badge before its label; an asset row carries an `a`
  badge before its label.
- Empty state: the per-section "No boards yet." / "No assets yet." copy is
  dropped; one line shows only when the whole Files listing is empty.
- The active-row keeper spans the merged listing, so the open board's row stays
  rendered and marked when it sits outside the visible window (today an open
  board can be windowed out of its own listing).
- The loading-placeholder, scrollbar-gutter, and shell-layout requirements are
  updated from three sidebar bodies to the single Files body.

## Capabilities

### New Capabilities

None. This reshapes existing sidebar behavior; no new capability is introduced.

### Modified Capabilities

- `ui-shell`: the sidebar is an accordion of Journal and Files sections, not
  Journal, Pages, Boards, and Assets; loading placeholders, scrollbar-gutter
  regions, and the shell layout's scroll-region list name the single Files
  body.
- `static-navigation`: the sidebar listing requirement moves from a Pages
  section to the Files section, states the merged order and the badge-marked
  kinds, and keeps windowing; the no-folder state renders two empty sections.
- `vault-assets`: the "Assets section" requirement becomes the asset rows of
  the Files listing, badged and path-ordered after the pages.
- `whiteboards`: the "sidebar's Boards section" requirement becomes the board
  rows of the Files listing, badged and path-ordered after the pages, with the
  open board's row marked.
- `page-editing`: the drag-into-the-page requirement's references to dragging a
  row "from the sidebar's Assets section" / "Pages section" become the Files
  listing; behavior unchanged.
- `page-references`: "A page row can be dragged into the open page" names the
  sidebar's Files listing instead of its Pages section; behavior unchanged.
- `pinned-pages`: "Pins persist in a hidden vault meta file" names the Files
  listing instead of the Pages section; behavior unchanged.
- `search`: the "file outside the assets folder is not searchable" scenario
  names the Files listing's asset rows instead of the Assets section; behavior
  unchanged.

## Non-goals

- No change to the Journal calendar or its behavior.
- No change to how a page, board, or asset is opened, referenced, indexed, or
  written.
- No new filesystem reads: boards and assets keep their path order; no
  last-modified time is collected for them (ADR-0022's "no extra `stat`"
  stands).
- No change to search, its groups, or its ordering. The search delta is a
  wording update to one scenario, not a behavior change.
- No rename of the meta panel's Forwardlinks "Files" group. The sidebar's
  Files section is the superset (pages + boards + assets); the meta panel's
  Files group stays the narrower page-referenced set. The scope difference is
  deliberate and recorded here.
- No board or asset editing, renaming, or deletion.
- No new ADR: no architectural invariant, storage contract, or persistence
  model changes.

## Impact

- `src/components/Sidebar.tsx` and `Sidebar.module.css`: three accordions
  collapse into one; one scroll body, one `ListView`, one `windowPieces` pass;
  badge rendering per row kind.
- `src/App.tsx`: assemble the merged, ordered row array and memoize it on
  `graph`/`pins` identity (the keystroke budget, AGENTS.md); adjust the props
  passed to `Sidebar`.
- Tests: `src/components/Sidebar.test.tsx`, `src/components/FolderRail.test.tsx`
  (unaffected but nearby), `src/App.test.tsx`.
- Specs: `ui-shell`, `static-navigation`, `vault-assets`, `whiteboards`,
  `page-editing`, `page-references`, `pinned-pages`, `search`.
- No dependencies, no `VaultStorage` change, no index change.
