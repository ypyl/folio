# Folio

A lightweight, local-first alternative to Logseq. Your Markdown folder is the database; the app is just a UI and index over it.

Live build: <https://ypyl.github.io/folio/> (Chromium browsers only — it needs the File System Access API).

Every push to `master` builds with `GITHUB_PAGES=1` (base `/folio/`) and deploys to GitHub Pages via `.github/workflows/deploy.yml`. Run `npm run dev` locally for the root base.

## Features

- Open a local Markdown folder (vault) directly from the browser
- View and edit `.md` files with auto-save
- Page references (`#word`, `#[[Page]]`) and backlinks
- Daily journal pages
- Full-text search
- Three-pane layout: sidebar, editor, backlinks
- One-way import of an existing Logseq graph (pages, journals, and assets), merged without overwriting

## Tech Stack

- React + TypeScript (Vite)
- File System Access API (Chromium-first: Chrome, Edge, Brave)
- `react-markdown` + `remark-gfm`
- Fuse.js for search
- No backend

## Getting Started

```bash
npm install
npm run dev
```

See [research/01-project-discussion.md](research/01-project-discussion.md) for the full project spec.

## Importing from Logseq

With no folder open, the brand screen offers **Import from Logseq**. Pick the Logseq
folder (read-only) and a destination folder, and Folio translates the graph into its own
Markdown rules, merges it without overwriting anything the destination already holds,
shows progress, and opens the result. The rule set is documented in
[MIGRATION_LOGSEQ_FOLIO.md](MIGRATION_LOGSEQ_FOLIO.md), implemented in the app and in
`scripts/migrate-logseq.mjs`, and recorded as one-way and input-only in
[ADR-0025](adr/0025-logseq-import-is-one-way-and-input-only.md).

## License

MIT