# Plan

One feature at a time, no waterfall. After every step the app builds and runs. We start with the UI shell on mock data, then put real functionality behind the same screens, swapping mock pieces as they get real implementations.

1. [x] **UI shell** — Kami tokens from `DESIGN.md` (colors, spacing); three-pane layout: left sidebar, editor area, right meta panel. Everything static.
   - Left sidebar is an accordion: top **New Page** button, collapsible **Journal** section (holds the calendar), collapsible **Pages** section.
   - Right panel is an accordion of page meta: **Backlinks** (pages linking to this one), **Forwardlinks** (links this page points to).
2. [x] **Static navigation** — mock vault with a few sample pages; the sidebar accordion lists pages and journal entries; clicking swaps the editor area content. No filesystem, no persistence, fully clickable in dev.
3. [x] **`VaultStorage` interface** — `read / write / delete / list` in `src/vault/`.
4. [x] **File System Access implementation** — wrapper around `showDirectoryPicker()` + `FileSystemDirectoryHandle`.
5. [x] **Open folder flow** — "Open folder" button wired to the picker; handle persisted in IndexedDB, re-opened on reload. Until a folder is chosen, the mock vault still shows.
6. [x] **Scan + parse + index** — walk the folder, extract title / page references (`#word`, `#[[Page]]`), build pages + backlinks maps; sidebar and routing now use real pages when a folder is open; index updates incrementally as files change.
7. [x] **Milkdown editor** — replaces the mock editor; edits real page content; write-through with debounced auto-save; dirty indicator.
8. [x] **Asset drag & drop** — drag any file onto the editor; copy it into the vault (`assets/`, unique name on collision), then insert a markdown link (`![name](assets/name.ext)` for images, plain link otherwise) at the cursor position.
9. [x] **Links pane** — real Backlinks / Forwardlinks from the index in the right accordion, click to navigate.
10. [x] **Daily journal** — calendar in the Journal section: Sunday-first month grid, days with files filled, browse months, click a day to open `journals/YYYY-MM-DD.md` (blank until first write, then materialized).
11. [ ] **Search** — Fuse.js over the index, results in the sidebar, keyboard shortcut.
12. [x] **PWA** — offline-capable precache, installable, icon.

## Later ideas

Undecided ideas, deliberately not scheduled. Revisit when a task touches their area; turn into a numbered task (and an OpenSpec change) only when we commit to building them.

- **Asset rendering** — resolve `assets/` paths in the editor to blob URLs so dropped images actually display (today they show as broken images by design). Also opens click-to-view for non-images.
- **Orphan asset cleanup** — scan `assets/`, find files no page references, offer removal ("remove unreferenced attachments").
- **Unlinked references** — pages whose plain body mentions a page name without a link token (Logseq's third list). Needs its own matching semantics (word boundary, case, dash handling) and dedup against real backlinks; deliberately deferred from the links pane to keep that change about the actual link graph.
- **Non-date journal files in the calendar** — files under `journals/` that aren't `YYYY-MM-DD` (e.g. `journals/notes.md`) render no calendar cell; the calendar replaced the day list that used to surface them. Decide the escape hatch (a small "other journal files" list) when the vault actually has such files.
- **Reference-aware asset deletion** — decide the semantics when a page/asset is deleted: does removing the last reference delete the file? Needs explicit confirmation; today deleting a link leaves the asset on disk (safe default).