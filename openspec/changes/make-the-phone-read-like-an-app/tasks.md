# Tasks

Note: `AGENTS.md` bumps `version` in `package.json` on every commit — a minor bump
for this change.

Browser checks start a dev server with `npm run dev:test` (an OS-picked port the
log names), confirm the log says `ready in`, and sweep leftovers with
`npm run kill:dev`. A check that ran against a stale server is not evidence.

## 1. The compact scale

- [x] 1.1 Apply the compact type values in the module stylesheets: list rows and
  meta rows 16, section labels 12, calendar days 14, weekdays 11, month 15,
  status and tab labels 12, buttons 16, menu items 15, badges 11, brand
  description 16, facts 14/13, footer 13, secondary copy 14. Verify with an e2e
  case at 390×844 that reads the computed font sizes of the editor, a list row, a
  summary, a calendar day, and the app bar.
- [x] 1.2 Raise the compact editor to 16px with 20px headings through a compact
  override of the CodeMirror root and the heading class, leaving the wide editor
  at 15px. Verify the computed editor size at compact and the unchanged size at
  1280px.
- [x] 1.3 Set the compact icon sizes to 24 (rail glyphs, view-control glyphs,
  app-bar glyphs), keeping the brand mark's identity size. Verify the app bar and
  rail controls still meet the target rule.

## 2. Targets, rows, margins

- [x] 2.1 Raise every compact target from 44 to 48: app bar title and actions,
  rail controls and the close hit area, accordion summaries, Files and meta rows,
  calendar month controls and day cells, menu items, search controls and rows,
  shortcut chips, presentation controls, brand actions. Verify with the e2e
  measurement case updated to 48, with the calendar's width exception (48 tall,
  at least 44 wide).
- [x] 2.2 Make a compact Files row 52 tall, set `COMPACT_ROW_STRIDE` to 54, and
  update the loading skeleton to match. Verify with the `pageWindow` unit tests
  and a browser scroll check of a long listing.
- [x] 2.3 Put the navigation panes' content 16px from the trailing edge on
  compact (sidebar and accordion body padding), and verify with the e2e margin
  case.

## 3. The app bar

- [x] 3.1 Add `CompactBar` (56px, title, optional page-actions control) with its
  module stylesheet, title-as-control accessible names, and the `RowContextMenu`
  it opens at the actions control. Verify with unit tests for the title, the
  text-only title, and the actions control's menu.
- [x] 3.2 Render `CompactBar` in `App` above the three layers at compact, with
  the title per view (page, board, results, Details, folder or Folders, Folio),
  the title's locate callbacks, and the page actions built from the open page's
  row, rule, and handlers. Offset the compact layers below the bar. Verify with
  integration tests: the title per view, locating a page and a journal day, the
  actions menu for a page, and no actions for a journal day or a board.
- [x] 3.3 Keep the wide composition unchanged: no bar, the same editor base size,
  and the same status bar. Verify with the existing wide e2e case.

## 4. The labeled view controls

- [x] 4.1 Give the compact status bar's two view controls a visible label under
  the glyph, a 48px target, and a bar height of 56 plus the safe-area inset;
  keep the shape-and-tint state and the save state between them. Verify with unit
  tests for the labels and pressed state and with the e2e bar cases.
- [x] 4.2 Remove the open item's name from the compact status bar (the app bar
  owns it) and keep the wide breadcrumb, stats, and version. Verify the compact
  bar shows the save state only between the controls, and the wide bar is
  unchanged.

## 5. The reconnect action

- [x] 5.1 Add `reconnect` to `EditorPane`'s brand screen: primary `Continue with
  <name>`, then the open-folder action at compact, the demo, and the import, and
  pass it from `App` while the active folder's permission is pending. Verify with
  integration tests: the action shows while pending, calls the request path, and
  is gone once the folder opens.
- [x] 5.2 Check the action on the device: a cold launch offers the folder, one
  tap and one system Allow open today's journal.

## 6. The install surface

- [x] 6.1 Add `id: './'`, `categories`, and two narrow `screenshots` to the
  manifest, and commit the two phone screenshots under `public/`. Verify with an
  e2e case that fetches the manifest and asserts the id, the categories, and both
  screenshots with their sizes, and with a CDP installability check (no errors).

## 7. The design language

- [x] 7.1 Record the compact scale, 48px targets, 52px rows, 16px margins, the
  labeled view controls, and the app bar in `DESIGN.md`'s touch-target and
  sidebar sections. Verify nothing it states contradicts the delta spec.

## 8. Integration checks

- [x] 8.1 Run `npx oxlint --fix`, `npm run fmt`,
  `npx oxlint --deny-warnings --format=agent`, `tsc -b`, `npm run build`, and the
  full `npm test`; confirm all are clean and coverage holds.
- [x] 8.2 Run `npm run test:e2e` and confirm the whole suite passes, including the
  updated compact cases and the wide composition case.
- [x] 8.3 On the Pixel 9a over `adb reverse`, check every compact view: readable
  type, 48px targets, the app bar title and actions, the labeled tabs, the
  reconnect on a cold start, the keyboard shrink, and no sideways scroll. Sweep
  the server and the tunnel afterwards.

## Workflow follow-up

- Archive the change after the checks pass, syncing the main spec and bumping the
  version again.
- Push `master` to `origin` and `nas`.
