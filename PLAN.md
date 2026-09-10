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
17. [x] **Right panel help** — the keyboard-shortcuts reference leaves the status bar's `?` button and its modal, becoming the right panel's last collapsible section: collapsed by default, with its summary row anchored to the panel's bottom edge and the list expanding in place above it. The status bar is left display-only apart from the pin star. The panel widens from 220px to 280px, with the workspace and header columns sharing `:root` custom properties so they cannot drift. The heading-level row collapses to one `Ctrl+Alt+1..6` range chord, kept honest by the live-keymap drift guard that now covers levels 1-6.
18. [x] **Reference badges** — references (`#word`, `#[[Page]]`) render as clickable chips over their literal text in the editor; a plain click or `Mod+Enter` opens the target, resolving like the links pane (an existing page, or a blank one created on first save). The badge depends only on the document, so moving the caret never repaints it, references inside code spans or fences are left alone.

19. [x] **Reference completion** — typing `#` or `#[[` in the editor offers the vault's own pages in a popup (prefix match first, then a word start, pinned and recently edited first, capped at 8 rows, journals included). The first row is active, `Enter`/`Tab` accept, `ArrowUp`/`ArrowDown` move, `Escape` dismisses, and nothing is claimed while the popup is hidden, so `Mod+Enter` still opens the literal reference at the caret. Accepting writes one canonical token in the page's on-disk casing, in the form the trigger used (brackets stay brackets; a spaced name escalates to `#[[...]]`), as an ordinary edit that saves and undoes like typing. Measured at 0.24 ms per keystroke at 10k pages, and only while the popup is visible.

20. [x] **Bound the editor's per-keystroke work** — the line-number gutter measured and wrote each block in turn, so every style write invalidated the layout the next block's read forced: 1.5 s of blocked main thread on a 1500-block page once typing paused, and the same again on every reflow. It now measures every block in one pass and writes every number after (`src/editor/gutter.ts`), which took that update to 8 ms with the numbers in identical positions. Reference badges stopped rescanning the whole document on every change, dropping that scan from 4.3 ms at 5000 blocks to 0.025 ms for the block an edit touched. Keystroke latency in a long page is unchanged by either fix: what remains is browser-side (style, layout, and accessibility work on a large contenteditable), not app JS.

## Later ideas

Undecided ideas, deliberately not scheduled. Revisit when a task touches their area; turn into a numbered task (and an OpenSpec change) only when we commit to building them.

- **Asset rendering** — resolve `assets/` paths in the editor to blob URLs so dropped images actually display (today they show as broken images by design). Also opens click-to-view for non-images.
- **Orphan asset cleanup** — scan `assets/`, find files no page references, offer removal ("remove unreferenced attachments").
- **Unlinked references** — pages whose plain body mentions a page name without a link token (Logseq's third list). Needs its own matching semantics (word boundary, case, dash handling) and dedup against real backlinks; deliberately deferred from the links pane to keep that change about the actual link graph.
- **Non-date journal files in the calendar** — files under `journals/` that aren't `YYYY-MM-DD` (e.g. `journals/notes.md`) render no calendar cell; the calendar replaced the day list that used to surface them. Decide the escape hatch (a small "other journal files" list) when the vault actually has such files.
- **Reference-aware asset deletion** — **won't do** (decided 2026-09-10). Deleting a link stays non-destructive: the asset remains on disk, and the app never scans references to decide whether to delete a file. No reference-aware cleanup and no deletion prompts; the safe default is the decision, not an open question.

- start adding version -> near the title badge
- add some reasonable limitation to markdown file

- the document-proportional cost of typing in a long page is browser-side, not app JS (measured: ~100 ms of app JS against 480 ms of wall time for a 53-character burst at 1500 blocks, frame gaps holding at 60 fps, and `content-visibility`/`contain` hints making it worse). Needs renderer-level profiling before it can be scoped.

- allow to select text on the page and move it to a new page

- actually apply keystroke when user click on it in shortkut window

- when reference is only one in line, even clikcing on the end of the line -> navigates to the page referenced by link
