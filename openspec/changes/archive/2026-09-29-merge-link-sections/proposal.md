## Why

Backlinks and Forwardlinks are two accordions for one subject: the open page's
links. Splitting them costs a section header, splits the panel's height, and
hides the outgoing links behind a collapse. One "Links" list shows the page's
incoming and outgoing rows together, each badged with its direction or file kind.

## What Changes

- **BREAKING** The Backlinks and Forwardlinks sections are replaced by one
  **Links** section, open by default, with one scroll body.
- Rows, in order: the pages that reference the open page (most recently edited
  first, path ascending as the tiebreak), then the pages the open page
  references (document order), then its assets (document order), then its boards
  (document order).
- **Every row carries a badge** before its label: a backlink page `in`, a
  forwardlink page `out`, an asset `a`, a board `b`.
- **One empty state** replaces the two per-section copies, shown only when the
  merged list has no rows.
- The board-mode **Referenced by** section stays (a board has no forwardlinks);
  its rows are backlinks and carry the `in` badge.
- A link row keeps its `kind` (for what activating it does) and gains a `badge`
  (for what it reads).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-shell`: the meta panel is an accordion of Contents, Links, and the
  keyboard-shortcuts reference; the loading placeholders, scrollbar-gutter
  regions, shell layout, collapsed-links, and keyboard-shortcuts requirements
  name one Links section instead of two link sections.
- `static-navigation`: the link-rows requirement names the Links section.
- `page-contents`: the Contents section sits above the Links section, and the
  panel's single link section takes the remaining height.
- `vault-assets`: "A page's files are listed in the Forwardlinks list" becomes
  asset rows in the Links list, badged `a`.
- `whiteboards`: "A page's board references are listed in the Forwardlinks list"
  becomes board rows in the Links list, badged `b`; the board's Referenced by
  rows carry the `in` badge.
- `page-editing`: one drag scenario's wording becomes the Links list.

## Non-goals

- No change to which links exist, their order, or what activating one does.
- No change to the sidebar or its badges.
- No change to the index, storage, or persistence.
- No new ADR.

## Impact

- `src/components/MetaPanel.tsx` and `MetaPanel.module.css`: one `Links` section
  replaces Backlinks and Forwardlinks; `LinkRow` gains `badge`; the badge box
  sizes to `in`/`out`/`a`/`b`.
- `src/App.tsx`: one memoized Links row array (backlinks + forwardlink pages +
  files), each row badged.
- Tests: `MetaPanel.test.tsx`, `App.test.tsx`.
- Specs: `ui-shell`, `static-navigation`, `page-contents`, `vault-assets`,
  `whiteboards`, `page-editing`.
