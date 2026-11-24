# Tasks

## 1. The hold

- [x] 1.1 `src/useDelayedFlag(value, ms)` in a new `src/useDelayedFlag.ts`: turns
  true only after the value has held, clears the timer when it drops, and cleans
  up on unmount. Verify with unit tests for a value that settles inside the hold
  (never true), one that persists (true after the hold), and one that drops
  mid-hold (never true).

## 2. The shell's restore window

- [x] 2.1 `saveStateLabel` gains `restoring`, ranked above `indexing` and the save
  state, returning "Opening your notes…". Verify with unit tests over the ranked
  cases, including that `indexing` still wins over a dirty page.
- [x] 2.2 `StatusBar` takes `restoring` and passes it through; `App` supplies it
  from the held restore flag. Verify with a `StatusBar` test for both phases and
  an `App` integration test that a slow restore shows the pane's skeleton and the
  reopening phrase, and that a fast one shows neither.
- [x] 2.3 `App` computes one shell loading flag (`restore held or indexing`) and
  passes it to the sidebar, the editor pane, and the right panel. Verify with an
  `App` integration test that the restore window shows the sidebar and pane
  placeholders, and that they end with the folder's content.

## 3. A pending diagram

- [x] 3.1 `src/editor/diagrams.ts` paints the app's loading placeholder into a box
  when it registers, marks the box busy and labels it for assistive technology,
  and clears both when the drawing or a refusal replaces it. Verify with unit
  tests for a pending box, a drawn box, and a refused box.
- [x] 3.2 `src/index.css`: the placeholder's box inside `.folio-diagram`, keeping
  the reserved height so the prose does not jump. Verify in the running app, and
  with the editor integration test that a pending box carries the placeholder.

## 4. Documentation

- [x] 4.1 One line in DESIGN.md's diagrams section saying what a pending drawing
  looks like, and that the pulse is the same one the rest of the app uses.

## 5. Integration and release shape

- [x] 5.1 Run the whole gate: `npm test`, `npx tsc -b`, `npx oxlint
  --deny-warnings --format=agent`, `npm run build`, and `npm run test:e2e`.
- [x] 5.2 Bump `version` in `package.json` (minor) and run `npm run changelog`.

## Workflow follow-up

- Archive the change after the gates pass, syncing the main specs and moving the
  change directory, with the archive commit's own patch bump.
- Push `master` to `origin` and `nas`, then publish the GitHub Release
  `v<feature version>` at the feature commit, drawn from `CHANGELOG.md`.
