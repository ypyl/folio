# Folio

A lightweight, local-first alternative to Logseq. Your Markdown folder is the database; the app is just a UI and index over it.

## Features

- Open a local Markdown folder (vault) directly from the browser
- View and edit `.md` files with auto-save
- `[[wikilinks]]` and backlinks
- Tags (`#tag`)
- Daily journal pages
- Full-text search
- Three-pane layout: sidebar, editor, backlinks

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

## License

MIT