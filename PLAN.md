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
11. [x] **Search** — full-text Fuse.js search in the header with a results dropdown (Pages/Journal groups, match snippets), Cmd/Ctrl+K focus, arrow/Enter navigation.
12. [x] **PWA** — offline-capable precache, installable, icon.
13. [x] **File breadcrumb** — the open page's vault-relative path rendered as a segmented, non-interactive breadcrumb at the top of the editor pane (sticky, directories truncate first), so the real file name behind the title is always visible.
14. [x] **Status bar** — a thin app-level bar below the workspace consolidating all status: the file-path breadcrumb, the save/indexing status text (after the breadcrumb, divider-separated), the vault name · file count, and the `?` help button in the far-right corner (its dialog also closes on outside clicks). The pane's own status layers and the header's right slot are gone.
15. [x] **Line numbers** — the editor gutter numbers each block's first line (sparse signature: 1, 3, 5; lists get one number), and search results show `· line N` for text matches, so a highlighted match is easy to locate in the document.
16. [x] **Pinned pages** — star the open page from the status bar's leading corner (enabled for pages only; journal days, unmaterialized pages, and search results disable it): pins persist as an ordered list in the vault's hidden `.folio/pins.md` (ADR-0015), pinned pages lead the Pages section in pin order with a bolder title style, and the remaining pages sort by last-edited descending.

## Later ideas

Undecided ideas, deliberately not scheduled. Revisit when a task touches their area; turn into a numbered task (and an OpenSpec change) only when we commit to building them.

- **Asset rendering** — resolve `assets/` paths in the editor to blob URLs so dropped images actually display (today they show as broken images by design). Also opens click-to-view for non-images.
- **Orphan asset cleanup** — scan `assets/`, find files no page references, offer removal ("remove unreferenced attachments").
- **Unlinked references** — pages whose plain body mentions a page name without a link token (Logseq's third list). Needs its own matching semantics (word boundary, case, dash handling) and dedup against real backlinks; deliberately deferred from the links pane to keep that change about the actual link graph.
- **Non-date journal files in the calendar** — files under `journals/` that aren't `YYYY-MM-DD` (e.g. `journals/notes.md`) render no calendar cell; the calendar replaced the day list that used to surface them. Decide the escape hatch (a small "other journal files" list) when the vault actually has such files.
- **Reference-aware asset deletion** — decide the semantics when a page/asset is deleted: does removing the last reference delete the file? Needs explicit confirmation; today deleting a link leaves the asset on disk (safe default).

- start adding version -> near the title badge
- add links as badges in page so they are visible
- I don't like how shortcut helper popup looks like
- add some reasonable limitation to markdown file

- help not in the corner lie button and modal window, but like accordion item in the bottom of the right side bar
- allow to select text on the page and move it to a new page
