## Why

A whiteboard is the one durable artifact Folio cannot hold. A vault file that is not Markdown can only be an opaque asset (ADR-0022): listed, opened as a copy, never written. A sketch has no home — it cannot be created, edited, or referenced as a first-class thing, so a diagram that belongs to a note lives outside the vault.

A board is neither a page nor an asset. It is a document the app understands and edits, but does not index as a page. Giving it a reference form (`#!word` / `#![[Many Words]]`) restores the app's native creation pattern — write the reference, and the thing appears — and lets a page or journal point at a board the way it points at another page.

## What Changes

- **A board is a new kind of vault file**: a `.excalidraw` file under `boards/`, at any depth, no hidden segment. It is not a page (no search content, no backlinks, no pins, no draft store) and not an asset (the app parses, edits, and writes it).
- **A board reference is a new lexical form**: `#!word` and `#![[Many Words]]` — the page forms with a `!`. It resolves by name to `boards/<name>.excalidraw`, case-insensitively. The token stays in the Markdown; the file is derived (ADR-0001).
- **Delayed creation, like a page**: a board token naming a board that does not exist opens a blank board in memory and materializes `boards/<name>.excalidraw` on first save. Typing a token never leaves an orphan file.
- **The board editor** opens in the main pane via a click on the token badge: Excalidraw, lazy-loaded and code-split, excluded from the offline precache. Only element changes save; pan and zoom do not.
- **Extension decides the view**: any `.excalidraw` file opens in the board editor, reached by token, an ordinary path link, the sidebar's Boards band, or a search result.
- **Boards join the surfaces**: a **Boards** band in the sidebar, a **Boards** group in search (name-only, like assets), and **Referenced by** in the meta panel while a board is open (the pages whose Markdown writes the token). Opening a board enters the Back/Forward trail.
- **ADR work**: amend ADR-0006 (reverses its explicit "whiteboards are out of scope"), amend ADR-0012 (`one namespace: pages` widens to two reference kinds), and add a new ADR for the board file kind. ADR-0022 is unchanged — a board is not an asset.

## Capabilities

### New Capabilities
- `whiteboards`: the board file kind and its folder rule, the `#!` reference forms and their resolution, board completion, delayed creation, the board view and its save lifecycle, and Referenced by.

### Modified Capabilities
- `vault-index`: derive the boards inventory from the `boards/` folder and each page's board references from its content; expose the pages that reference a board.
- `static-navigation`: opening a board replaces the main pane; the sidebar's sections include Boards.
- `ui-shell`: the sidebar's section set, the meta panel's board mode, and the status bar's board state.
- `search`: boards join the corpus by name and gain their own group and result kind.
- `page-history`: the session trail holds board entries as well as pages.

## Non-goals

- **No inline embed.** A page never renders a board's picture; it points at the board. There is no combined `.excalidraw.png` or `.excalidraw.svg` artifact.
- **No board-as-Markdown-page.** No `.excalidraw.md` and no fenced scene JSON in a page. A board is not a page record.
- **No rename, move, or delete** of a board from the app, matching the asset rule.
- **No camera as content.** Pan and zoom are view state, never persisted as a document change.
- **Nothing else moves.** Pages, journals, assets, search ranking, and the reference namespace for pages are unchanged.
- No board folders UI, templates, collaboration, or export.

## Impact

- **New dependency**: `@excalidraw/excalidraw` (MIT, React 19 compatible). Lazy chunk (~2.9 MB js+css) fetched on first board open; excluded from the Workbox precache in `vite.config.ts`.
- **Vault layer**: board reference extraction and the boards inventory/referrers (`src/vault/parse.ts`, `src/vault/index.ts`), the `.excalidraw` open route (`src/vault/assetOpen.ts`), and the board form rules (`src/vault/link.ts`).
- **Editor layer**: the board badge and the `#!` completion trigger (`src/editor/`), beside the existing page-reference surface.
- **Component layer**: a Boards sidebar band, the board view host, Referenced by in the meta panel, and the search group (`src/components/`).
- **App layer**: a third main-pane mode and board routing in the trail (`src/App.tsx`).
- **ADRs**: amend 0006 and 0012; add a board-kind ADR.
