# Plan

One feature at a time, no waterfall. After every step the app builds and runs. We start with the UI shell on mock data, then put real functionality behind the same screens, swapping mock pieces as they get real implementations.

1. [x] **UI shell** — Kami tokens from `DESIGN.md` (colors, spacing); three-pane layout: left sidebar, editor area, right meta panel. Everything static.
   - Left sidebar is an accordion: top **New Page** button, collapsible **Journal** section (holds the calendar), collapsible **Pages** section.
   - Right panel is an accordion of page meta: **Backlinks** (pages linking to this one), **Forwardlinks** (links this page points to).
2. [x] **Static navigation** — mock vault with a few sample pages; the sidebar accordion lists pages and journal entries; clicking swaps the editor area content. No filesystem, no persistence, fully clickable in dev.
3. [x] **`VaultStorage` interface** — `read / write / delete / list` in `src/vault/`.
4. [x] **File System Access implementation** — wrapper around `showDirectoryPicker()` + `FileSystemDirectoryHandle`.
5. [x] **Open folder flow** — "Open folder" button wired to the picker; handle persisted in IndexedDB, re-opened on reload. Until a folder is chosen, the mock vault still shows.
6. [ ] **Scan + parse + index** — walk the folder, extract title / `[[wikilinks]]` / `#tags`, build pages + backlinks + tags maps; sidebar and routing now use real pages when a folder is open; index updates incrementally as files change.
7. [ ] **Milkdown editor** — replaces the mock editor; edits real page content; write-through with debounced auto-save; dirty indicator.
8. [ ] **Asset drag & drop** — drag any file onto the editor; copy it into the vault (`assets/`, unique name on collision), then insert a markdown link (`![name](assets/name.ext)` for images, plain link otherwise) at the cursor position.
9. [ ] **Links pane** — real Backlinks / Forwardlinks from the index in the right accordion, click to navigate.
10. [ ] **Daily journal** — calendar in the Journal section of the left sidebar; clicking a day opens/creates `journals/YYYY-MM-DD.md`, navigate to other days.
11. [ ] **Search** — Fuse.js over the index, results in the sidebar, keyboard shortcut.
12. [ ] **PWA** — offline-capable precache, installable, icon.