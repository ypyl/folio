# Links Pane — Tasks

## 1. Pending-page machinery (navigate-to-blank, materialize-on-save)

- [x] 1.1 Add the pending set to App state: `pendingRef` (or state) of vault-relative paths opened this session with no file. `handleSelect` adds the path when the graph has no page for it; a folder switch clears it.
- [x] 1.2 `displayed` consults `pending`: for a pending path with no graph page, synthesize an empty IndexPage (stem title from path, blank content) instead of falling to `null`. (`activePath` null still shows the empty state.)
- [x] 1.3 Drop the path from pending on its first successful save (the saver's `savePage` success path), and keep the index rebuild consistent (`upsertPage` already creates the file and re-parses).
- [x] 1.4 SaveIndicator wording for a dirty pending page: "New page — created on first save" instead of "Unsaved changes" (clean pending pages show nothing). Verify in an App-level test: open a missing page, type, indicator shows the new-page wording; after save the tree has the file and the wording is gone.

## 2. MetaPanel renders real rows

- [x] 2.1 MetaPanel gains props: `activeName`, `backlinks: { title, path }[]`, `forwardlinks: { title, path }[]`, `materializedPaths` (or a `materialized: boolean` per row), and `onSelect`. No vault import (design D6).
- [x] 2.2 Backlinks section: when a page is open and backlinks exist, render sidebar-style buttons (rows); when empty render "Nothing links here yet."; when no page is open render the existing placeholder copy.
- [x] 2.3 Forwardlinks section: same structure; empty copy "This page links to nothing."; rows whose target has no file render dimmed (muted token class) but remain clickable (D4).
- [x] 2.4 `aria-current="page"` on the open page's row; alphabetical case-insensitive sort of both lists (D5).
- [x] 2.5 Unit tests in MetaPanel.test.tsx: placeholder when no page open; rows for open page; empty-state copy; dimmed unmaterialized row class; click calls `onSelect` with the path; independent collapse still works.

## 3. App wiring and resolution

- [x] 3.1 In App, resolve the open page's lists: backlinks = `graph.backlinks.get(title.toLowerCase())` mapped to pages; forwardlinks = `page.links[].target` resolved through `graph.byName`, falling back to the referenced name with `.md` appended as the unmaterialized path (root pages materialize as `name.md`, preserving any directory part in bracketed names).
- [x] 3.2 Pass the resolved lists, the page-open state, and `onSelect` (reuse `handleSelect`) to MetaPanel. Rows navigate exactly like sidebar rows.
- [x] 3.3 App.test.tsx integration: opening `Welcome` (fixture where other pages reference it) shows its backlinks; clicking a backlink row opens that page; clicking a forwardlink to a missing page opens blank and creates no file until the first save (assert against the fake tree).

## 4. Gates

- [x] 4.1 Full gates: `npm test` green (suite grows), coverage >= 80, `npm run lint` clean, `npm run build` green, `openspec validate --changes` green.
- [x] 4.2 Dev smoke (user): open the sample vault, open a page that references others, click its links and a not-yet-created target; verify the file appears only after typing and saving, and the vault folder gains no orphan files.
