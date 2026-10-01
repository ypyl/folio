# Proposal

## Why

The board editor is loaded on every app start even though no board is open. `@excalidraw/excalidraw`, `mermaid`, `katex`, and `cytoscape` are emitted into one `excalidraw` chunk of about 2.3 MB gzip (~7.5 MB raw), and the entry chunk imports it statically, so `index.html` module-preloads it and the app boots behind it. This regresses the intent the whiteboards change recorded ("Excalidraw loads lazily and stays out of the offline install"; rejected a static import) and runs against the keep-it-small guardrail (ADR-0006).

The cause is chunk grouping, not a stray static import. The board chunk's group captures its dependencies recursively, so `dompurify` — a dependency of `mermaid` (board) *and* of `@milkdown/components` (the app) — is written into the board chunk. Because the app needs `dompurify`, the entry imports the whole board chunk. Startup pays roughly 2.3 MB gzip for a feature most vaults never use.

## What Changes

- The board's chunk grouping SHALL stop capturing modules the app itself uses, so the entry no longer imports the board chunk and the board editor is fetched only when a board is first opened.
- The board chunk SHALL still be named deterministically so the Workbox precache keeps excluding it from the offline install.
- No board feature or board behavior changes. No source under `src/` changes; this is build configuration plus its verification.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `whiteboards`: add a requirement that the board editor loads on demand — the app's initial load and the offline install SHALL NOT include the board editor's bundle; it is fetched when a board is first opened.

## Impact

- `vite.config.ts`: the board chunk group definition (`manualChunks` today) and its interaction with Vite 8 / rolldown's code splitting.
- Build output only: the emitted `index.html`, the entry chunk's static imports, and the set of precached chunks. No change to `src/`.
- Measured effect: expected drop of roughly 2.3 MB gzip from first load; the offline install already excluded the board chunk and stays that way.

## Non-goals

- Not trimming the CodeMirror language catalog. The 126 precached grammar chunks are a real install-size cost, but a separate change.
- Not removing Excalidraw, changing how a board is opened, edited, or saved, or altering any `whiteboards` requirement other than adding the load-on-demand requirement.
- Not switching, replacing, or reconfiguring the Markdown editor (Milkdown) or its dependencies.
- Not adding a backend, a database, or a block-based document model.
- Not introducing a new ADR: this restores the whiteboards design's D6 intent rather than changing an architectural decision.
