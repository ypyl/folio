# Folio

A lightweight, local-first alternative to Logseq. Your Markdown folder is the database; the app is just a UI and index over it.

Live build: <https://ypyl.github.io/folio/> (Chromium browsers only — it needs the File System Access API).

Every push to `master` builds with `GITHUB_PAGES=1` (base `/folio/`) and deploys to GitHub Pages via `.github/workflows/deploy.yml`. Run `npm run dev` locally for the root base.

## Features

- Open one or more local Markdown folders (vaults) directly from the browser; the folder is the database
- WYSIWYG Markdown editing with auto-save, GFM tables, syntax-highlighted code blocks, and block line numbers
- Page references (`#word`, `#[[Page]]`) with backlinks and forwardlinks, plus inline completion for references and link destinations
- Daily journal pages with a calendar
- Whiteboards: `.excalidraw` boards under `boards/`, referenced with `#!` tokens and edited in the pane
- Assets: drag, drop, or paste files into a page; browse them in the sidebar and open them from a page
- Full-text search over pages and journals, and by name over assets and boards
- Pinned pages, back/forward history, and a status bar
- One-way import of an existing Logseq graph (pages, journals, and assets), merged without overwriting
- Collapsible side panes; a PWA that installs and works offline

## Cleaning up the vault

Folio never deletes files. It edits them, so clearing a page in the app can leave an
empty file behind, but the file itself stays in the folder. Everything else,
deleting, renaming, moving, or emptying folders, is yours to do in your file
manager.

What a vault holds:

| Path | Holds |
| --- | --- |
| `pages/` | one `.md` file per page, optionally in subfolders |
| `journals/` | one `.md` file per day, named `YYYY-MM-DD.md` |
| `assets/` | dropped, pasted, and imported files, whatever the extension |
| `boards/` | `.excalidraw` whiteboards, referenced by `#!` tokens |
| `.folio/` | the app's own bookkeeping: `pins.md` (pinned pages) and `imports.md` (the Logseq import ledger) |
| anything else | ignored by Folio; a Markdown file is a page only under `pages/` or `journals/` |

So cleanup is plain file deletion:

- **Page or journal day**: delete its `.md` file. References to it stop resolving and
  backlinks to it go with it; nothing else is touched.
- **Attachment**: delete the file from `assets/`. It leaves the Assets listing and any
  page that named it.
- **Whiteboard**: delete the `.excalidraw` file from `boards/`. The `#!` token stays in the
  referring page and simply stops resolving.
- **Pins**: delete `.folio/pins.md`.
- **Logseq import ledger**: delete `.folio/imports.md` to make a folder importable again;
  the next run then writes those files once more, appending to what a previous run left.

Folio picks deletions up when it rescans: switching back to its tab, or reopening the
folder, re-lists the vault, so a file you deleted drops out of the index and one you
dropped in by hand appears.

## Tech Stack

- React 19 + TypeScript, built with Vite 8
- File System Access API (Chromium-first: Chrome, Edge, Brave)
- [CodeMirror 6](https://codemirror.net/) for the page surface: the Markdown text, with inline images, tables, and references rendered as view-only decorations (ADR-0029)
- [Excalidraw](https://excalidraw.com/) for whiteboards
- [Fuse.js](https://www.fusejs.io/) for search
- `vite-plugin-pwa` for offline and install
- Vitest for tests, oxlint/oxfmt for lint and format
- No backend and no application database

## Getting Started

```bash
npm install
npm run dev
```

See [research/01-project-discussion.md](research/01-project-discussion.md) for the full project spec.

## Documentation

- [adr/README.md](adr/README.md) — architecture decision records
- [openspec/specs/](openspec/specs/) — behavior specifications
- [DESIGN.md](DESIGN.md) — the design language
- [AGENTS.md](AGENTS.md) — how the project is built and kept small

## Importing from Logseq

With no folder open, the brand screen offers **Import from Logseq**. Pick the Logseq
folder (read-only) and a destination folder, and Folio translates the graph into its own
Markdown rules and merges it in: new files are written, a file the destination already
holds is appended to, and an existing asset is left alone. Progress is shown as it runs,
and the result summary reports what was written, merged, and skipped.

Importing several graphs into one vault is the intended use: import each in turn and
their pages and journals combine. A hidden `.folio/imports.md` ledger records every
source file already imported, so re-running an import — including resuming after a
partial failure — appends only what is new and never duplicates. Importing the same
folder twice is a no-op.

The rule set is documented in [MIGRATION_LOGSEQ_FOLIO.md](MIGRATION_LOGSEQ_FOLIO.md),
implemented in the app, and recorded as one-way and input-only in
[ADR-0025](adr/0025-logseq-import-is-one-way-and-input-only.md).

## License

MIT