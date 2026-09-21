## Context

`App` builds the panel's `referenceRows` from `pageAssets(page, graph)`; `page.boards` (the `#!` references) is not read there. `MetaPanel` is a pure renderer: it sorts rows by label and calls one activation handler per section. `handleOpenAsset` opens a vault file as a copy (`openVaultPath`). `isBoardTarget` already decides that any `.excalidraw` path opens the board editor.

## Goals / Non-Goals

**Goals:** a page's board references appear in References, labelled and dimmed correctly, and activate into the board editor.

**Non-Goals:** moving board references into Forwardlinks; changing how assets are listed or opened; a new panel section.

## Decisions

**Build the board rows in `App`, beside the asset rows.** `referenceRows` becomes assets plus boards, deduped by path (a board row wins over an asset row for the same path, so a token and a path link to one board produce one row). The rows are memoized on `[graph, page]`, so nothing joins the keystroke path. This keeps `MetaPanel` a renderer that knows nothing about the vault, the same boundary every other row follows.

**Route activation through the existing `onOpenAsset`, branched in `App`.** `handleOpenAsset` opens the board editor when `isBoardTarget(path)` is true and the file copy otherwise. One handler, one place where the extension decides the view — so a `.excalidraw` row from a token, a path link, the Assets band, or a search result all open the board. `MetaPanel` gains no vault import and no second callback.

**Enable dimming in the References list.** Board rows for a board the vault does not hold are unmaterialized, so the section's `LinkList` allows a `materialized: false` row to dim. Asset rows are always `materialized: true`, so their observable behaviour is unchanged — an asset row is still never dimmed.

Rejected: **a `kind` on `LinkRow`.** The label and materialized flag are already computed in `App`, and the view is decided by the path's extension, so a row kind would be a third way to say the same thing.

Rejected: **a separate `onOpenBoard` prop on `MetaPanel`.** It would move the extension rule into the component layer and give the References section two handlers to choose between.

## Risks / Trade-offs

- **A `.excalidraw` file that lives under `assets/` now opens the board editor from the Assets band too** → intended: the extension decides the view everywhere, and a board is never opened as a byte copy.
