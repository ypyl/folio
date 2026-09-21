## Why

A page can point at a board with a `#!` token, but the reference is invisible once written: the right panel's Forwardlinks lists page references only, and References lists the page's assets only, so a board a page refers to appears nowhere. The reader cannot see, from the open page, which boards it holds — the same gap assets had before their References section.

## What Changes

- A page's board references join the meta panel's **References** section, alongside the page's asset rows, in one alphabetically-ordered list.
- A board row is labelled by the board's path inside `boards/` (the label the sidebar's Boards section uses).
- A board the vault does not hold yet is rendered dimmed but remains activatable (like an unmaterialized page row); a board the vault holds is not dimmed.
- Activating a board row opens the board in the main pane — a navigation recorded in the trail, not a file copy.
- A `.excalidraw` file reached from References opens in the board editor whether the row came from a `#!` token or an ordinary path link (the extension decides the view).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `whiteboards`: a new requirement that a page's board references are listed in the meta panel's References section, how they are labelled and dimmed, and that activating one opens the board.

## Impact

- `src/App.tsx` — the References rows are built from the page's board references as well as its assets, deduped by path; the asset-open handler routes a `.excalidraw` path to the board editor.
- `src/components/MetaPanel.tsx` — the References list allows an unmaterialized row to dim (board rows; asset rows stay materialized, so unchanged in practice).
- No new dependency, no index change, no keystroke-path cost (the rows are memoized on `[graph, page]`).
