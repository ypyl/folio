# Tasks

Note: `AGENTS.md` bumps `version` in `package.json` on every commit — a minor bump
for this change, since a phone can now run the app, and `npm run changelog` after
the feature commits.

Browser checks start a dev server with `npm run dev:test` (an OS-picked port the
log names), confirm the log says `ready in`, and sweep leftovers with
`npm run kill:dev`. A check that ran against a stale server is not evidence.

## 1. The compact landing and the brand screen's action

- [x] 1.1 Change the compact landing rule in `src/App.tsx` so no active folder
  leads with the editor view (the brand screen), a folder with nothing open leads
  with the navigation view, and an item leads with the editor view; keep
  `restoring` leading with the editor. Verify with integration tests in
  `src/App.integration.test.tsx`: no folder → brand pane rendered and visible;
  folder + no page → navigation pane; page open → editor; brand activation and
  closing the active folder both return to the brand, not an empty sidebar.
- [x] 1.2 Give `EditorPane` an `onOpenFolder` prop and render the action on the
  brand screen at compact only — primary, label "Open folder", wired to the same
  handler as the rail's add control, and absent when the browser cannot open
  folders. Verify with an integration test that the action is rendered at compact
  (stubbed `matchMedia`), absent above it, and absent in the unsupported-browser
  state; verify the account of the action row in `EditorPane.integration.test.tsx`
  still holds.

## 2. The touch context-menu gesture

- [x] 2.1 Add `src/components/longPress.ts`: a helper returning pointer handlers
  for a press-and-hold, armed only where `matchMedia('(pointer: coarse)')` is
  true, cancelled by movement past 8px and by pointer up/cancel, firing once, and
  consuming exactly the click that follows. Verify with unit tests using fake
  timers and a stubbed `matchMedia`: fire after the delay, no fire on a short
  press, no fire after a move, no fire on cancel, the following click consumed and
  the next click untouched, and no arming on a fine pointer.
- [x] 2.2 Wire the helper into the Files listing's page rows in `Sidebar`, using
  the existing `openMenu` path, and keep the tap behavior unchanged. Verify with
  an integration test: a held press opens the row menu at the press without
  opening the page, a short press opens the page and no menu, and a hold that
  moves opens neither.
- [x] 2.3 Wire the helper into the calendar's day cells in `JournalCalendar`,
  using the existing day-menu path. Verify with an integration test: a held press
  opens the day menu for the pressed day without opening it, and a short press
  opens the day and no menu.

## 3. Touch targets across the compact shell

- [x] 3.1 Give the two button variants in `src/index.css` and the accordion
  summary in `Accordion.module.css` a 44px minimum height at the compact
  breakpoint. Verify the brand screen's actions and every section summary measure
  at least 44×44 at 390×844 in the e2e check added in 3.8.
- [x] 3.2 In `FolderRail.module.css`, size the rail's four controls and the folder
  entry to 44×44 and give the entry's 18px close badge a 44×44 invisible hit area
  in the corner it occupies. Verify by measuring the rail's controls at a phone
  viewport (3.8) and by a browser check that the badge's drawn mark is unchanged.
- [x] 3.3 In `JournalCalendar.module.css`, grow the day cells and the two month
  controls to a 44px minimum at compact, and confirm the calendar still fits its
  band at 390×844 (the existing calendar-height e2e case).
- [x] 3.4 In `Sidebar.module.css`, make a Files row 44 tall at compact, and make
  the windowed listing agree: add the compact stride beside `ROW_STRIDE` in
  `pageWindow.ts`, pass it from `Sidebar` when `matchesCompact()`, and size the
  loading skeleton rows to match. Verify the spacer arithmetic with unit tests in
  `pageWindow.test.ts` and the listing's scroll behavior in a browser check.
- [x] 3.5 In `MetaPanel.module.css`, grow the panel's rows, the Contents
  expand/collapse controls, and the disclosure chevron's hit area to the minimum
  at compact. Verify by measuring the meta view at a phone viewport (3.8).
- [x] 3.6 In `StatusBar.module.css`, give the open-item name control a 44px
  minimum height at compact without growing the bar beyond its current row.
  Verify the bar's height and the control's box at 390×844.
- [x] 3.7 In `SearchSpotlight.module.css`, `SearchResultsView.module.css`,
  `RowContextMenu.module.css`, `ShortcutsList.module.css`, and
  `PresentationView.module.css`, bring the remaining compact controls — the
  match-case toggle, the clear control, result rows, the see-all row, menu items,
  shortcut rows, and the presentation controls — to 44×44. Verify each with the
  measurement check in 3.8.
- [x] 3.8 Add an e2e case to `tests/e2e/compact-shell.spec.ts` that measures every
  control group the spec names (status bar, rail, calendar, listing, meta panel,
  brand screen, search spotlight, menus) at 390×844 and fails on any box under 44
  in either axis, and keep the existing app-bar and Journal-row cases.

## 4. The compact image

- [x] 4.1 Hide the vault image's expand control at the compact breakpoint in
  `EditorPane.module.css`, leaving the fitted size, the node view, and the
  expanded state untouched. Verify with a unit/integration test or a DOM check
  that the control is absent at compact and present above it, and a browser check
  that a fitted image renders at the pane's width on a phone viewport.

## 5. The design language

- [x] 5.1 In `DESIGN.md`, extend the touch-target section from the app bar and the
  Journal row to every control the compact shell shows (naming the groups and the
  target-over-mark rule), add the compact image exception to the Images section,
  and add one sentence naming press-and-hold as the phone's context-menu gesture.
  Verify the section still reads as rules, and that nothing it states contradicts
  the delta specs.

## 6. Integration checks

- [x] 6.1 Run `npx oxlint --fix`, `npm run fmt`,
  `npx oxlint --deny-warnings --format=agent`, `tsc -b`, `npm run build`, and the
  full `npm test` suite; confirm all are clean and the coverage thresholds hold.
- [x] 6.2 Run `npm run test:e2e` and confirm the whole suite passes, including the
  new compact measurement case and the existing wide-composition case.
- [x] 6.3 On the Pixel 9a over `adb reverse`, confirm with screenshots: the app
  lands on the brand screen with no folder, the open-folder action opens the
  picker, a long-press opens a row's menu and a day's reminder menu, a tap still
  opens the page or day, the rail/calendar/listing controls are comfortably
  thumb-sized, the keyboard still shrinks the shell, and `npm run kill:dev` and
  `adb reverse --remove-all` leave no server or tunnel behind.

## Workflow follow-up

- Archive the change after the checks pass, syncing the main specs and bumping the
  version again in the archive commit.
- Push `master` to `origin` and `nas`.
