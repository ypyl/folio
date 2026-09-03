# Lightweight Local-First Logseq Alternative

## Goal

Build a lightweight Logseq-like application that works directly with a user's local Markdown folder.

The motivation is to preserve the simplicity and portability of Markdown files rather than building a complex database-backed knowledge-management application.

The core idea:

> **The Markdown folder is the database. The application is just a UI + index over it.**

## Scope

Do **not** try to rebuild all of Logseq.

Focus on:

* Open a local folder/vault
* Read and write `.md` files directly
* Markdown editor + preview
* `[[wikilinks]]`
* Backlinks
* Tags such as `#ai`
* Daily journal pages
* Full-text search
* Auto-save
* Basic page navigation

Explicitly avoid initially:

* Block-level database
* Complex queries/query language
* Collaboration
* Sync
* Whiteboards
* Plugin ecosystem
* Complex graph visualization
* Backend/database infrastructure

The simplicity itself is the product.

## Proposed Architecture

Start as a **PWA** using the browser's File System Access API.

```text
React + TypeScript PWA
        │
        ├── Markdown parser/editor
        ├── Wikilink resolver
        ├── Backlink index
        ├── Tag index
        ├── Search
        └── Journal management
                │
                ▼
        Local Markdown folder
```

The application maintains an in-memory index:

```ts
type Page = {
  path: string
  title: string
  links: string[]
  tags: string[]
}

type Graph = {
  pages: Map<string, Page>
  backlinks: Map<string, string[]>
}
```

The index can be rebuilt when the vault is opened and updated incrementally when files change.

## Markdown conventions

Remain compatible with existing Markdown-based workflows.

Example:

```md
# Machine Learning

Related: [[Neural Networks]]

Tags: #ai #research
```

Journal files can simply be:

```text
journals/2026-09-03.md
```

This gives the application:

* Daily notes
* Pages
* Wikilinks
* Backlinks
* Tags
* Page creation/navigation

without introducing a database.

## UI

Keep the UI intentionally small:

```text
┌──────────┬────────────────────────┬──────────────┐
│ Sidebar  │ Main Editor / Page     │ Backlinks    │
│          │                        │              │
│ Journal  │ Machine Learning       │ Linked from  │
│ Pages    │                        │              │
│ Tags     │ Content...             │ [[AI]]       │
│ Search   │ [[Neural Networks]]    │ [[Research]] │
└──────────┴────────────────────────┴──────────────┘
```

Three-pane layout is enough.

Do not build a graph visualization initially. Backlinks provide most of the useful graph functionality.

## Suggested Technology

* Vite
* React
* TypeScript
* File System Access API
* `react-markdown`
* `remark-gfm`
* Fuse.js for search

No backend.

IndexedDB can optionally be used for caching the index, but it should not become the source of truth.

## Firefox / Browser Compatibility

The main limitation is the File System Access API.

Chromium browsers support APIs such as:

```ts
const root = await window.showDirectoryPicker({
  mode: "readwrite"
});
```

This provides a `FileSystemDirectoryHandle` that allows the application to directly read, write, create, delete, and enumerate files in the selected directory.

Firefox does not currently provide the same `showDirectoryPicker()` / File System Access API implementation.

There are older alternatives such as:

```html
<input type="file" webkitdirectory multiple>
```

but they do not provide the same clean persistent read/write model.

For this project, this is not a reason to over-engineer the application.

A reasonable initial position is:

> **Chromium-first: Chrome, Edge, Brave, etc.**

If broader desktop support becomes necessary, package the same frontend with **Tauri**.

## Important Architectural Decision

Keep filesystem access behind an abstraction:

```ts
interface VaultStorage {
  read(path: string): Promise<string>;
  write(path: string, content: string): Promise<void>;
  delete(path: string): Promise<void>;
  list(path: string): Promise<Entry[]>;
}
```

Then implementations can be:

```text
PWA
 └── File System Access API

Tauri
 └── Native filesystem API
```

The rest of the application should not care where the files come from.

This means the project can start extremely small as a PWA and later become a desktop application without rewriting the core knowledge-management logic.

## MVP

The first version should probably contain only:

1. Open Markdown folder
2. Scan files
3. Display Markdown
4. Edit Markdown
5. Save changes
6. Parse `[[wikilinks]]`
7. Show backlinks
8. Create/open daily journal
9. Search pages/content
10. Auto-save

Then stop and use it.

The main principle is:

> **Don't build Logseq. Build the smallest useful interface for navigating and editing a Markdown knowledge base.**
