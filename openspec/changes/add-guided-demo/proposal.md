# Proposal

## Why

A newcomer who opens <https://ypyl.github.io/folio/> sees a brand screen and an
empty app. To understand what Folio does, they must first find a Markdown folder
on their own disk, and every feature they want to see must be built by hand:
references, backlinks, a journal, a reminder, a board, an asset. The app tour
names the shell's regions, but it cannot show any of them working, and a visitor
without a Chromium browser cannot get past the brand screen at all.

The app needs a guided demo: a virtual vault, opened with one click, that is
wired to every feature and whose first page is a table of contents. It should
teach by example, not by prose alone.

## What Changes

- The no-folder screen gains **Open the guided demo**, in every browser,
  including one that cannot open local folders.
- The demo is a virtual vault seeded in memory with the same content kinds a real
  vault holds: pages, journal days (today included), a board, assets, pins, and
  reminder rules. No filesystem access, no picker, no permission prompt.
- The demo's Welcome page is a table of contents. Each guide page explains one
  feature and demonstrates it with the demo's own content: references,
  backlinks and forwardlinks, Contents, journal, reminders, boards, assets,
  search, editing and tasks, and presentation.
- The demo appears as a rail entry named "Demo vault", auto-opens its Welcome
  page instead of today's journal, and can be closed like any folder.
- Edits in the demo are real for the session (auto-save, backlinks, pins,
  reminders, boards, dropped files) and sandboxed: they live in memory only,
  are discarded when the demo is closed or the tab reloads, and are never
  written to disk, IndexedDB, or localStorage.
- The app tour's editor step names the guided demo as the place to try every
  feature; the brand screen and README point at it.
- New ADR: the guided demo is an in-memory vault, the one vault that is not a
  user folder.

## Capabilities

### New Capabilities

- `demo`: the guided demo vault: how it opens, what it holds, what it teaches,
  and why its edits are session-only and sandboxed.

### Modified Capabilities

- `workspace`: the no-folder brand screen offers the guided demo in every
  browser; the tour points at it as the worked example.
- `navigation`: the no-folder state offers the demo where local folders cannot
  be opened, so the app is explorable without a folder picker.

## Impact

- `src/demo/`: a `VaultStorage` over an in-memory file map, the seeded vault
  content (Markdown, a board scene, an SVG asset, a text asset, pins and reminder
  rules), and their tests.
- `src/vault/useVault.ts`: an `addVirtualFolder` path that adds and activates a
  storage-backed folder without a handle, without picker access, and without
  restoring it on reload.
- `src/App.tsx`: opening the demo, its Welcome landing page, and its rail entry.
- `src/components/EditorPane.tsx` and its stylesheet: the brand screen's demo
  control.
- `src/tour/steps.ts`: the editor step's copy.
- `README.md`: a "Try the demo" section.
- `adr/0034-the-guided-demo-is-an-in-memory-vault.md` and the ADR index.
- Tests: demo storage and seed, `useVault`, App integration, EditorPane, tour,
  and a Playwright demo suite that runs with no folder picker.
- No dependency. Markdown stays canonical (ADR-0001); the demo merely holds its
  Markdown in memory instead of on disk, through the same `VaultStorage` seam
  (ADR-0003). No backend, no database.

## Non-goals

- No persistence of demo edits across reloads or sessions.
- No "save the demo to a folder" or "export the demo" flow.
- No second tour overlay or a separate guide route: the demo's Welcome page is
  the table of contents, and the shell tour keeps its five regions.
- No new shell region, no change to the three-pane layout, and no change to how
  a real folder opens.
- No placeholder screenshots or scripted animations; the demo is the real app
  over seeded files.
