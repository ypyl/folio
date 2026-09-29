## 1. Order the panel's lists at their source

- [x] 1.1 In `src/App.tsx`, order the `backlinkRows` memo by last-modified descending with a path-ascending tiebreak (read `lastModified` from `graph.pages.get(path)`), leaving its `[graph, page]` dependencies unchanged; verify the Backlinks ordering test in `src/App.test.tsx` passes
- [x] 1.2 In `src/App.tsx`, order the `boardReferrerRows` memo by the same rule; verify the board Referenced by ordering test passes
- [x] 1.3 In `src/components/MetaPanel.tsx`, remove `LinkList`'s internal alphabetical sort so it renders rows in the order it receives them; verify the Forwardlinks Pages and Files tests pass with document order

## 2. Lock the new orders with tests

- [x] 2.1 Add a test that Backlinks lists the more recently edited referrer first and breaks a tie by path ascending; verify it fails against alphabetical order
- [x] 2.2 Add a test that the board's Referenced by lists the more recently edited page first; verify it fails against row-label order
- [x] 2.3 Add a test that Forwardlinks Pages follows the order references appear (not alphabetical) and Files lists assets then boards in their own appearance order; verify both fail against alphabetical order

## 3. Verify and version

- [x] 3.1 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`; verify all pass
- [x] 3.2 Run `npm test` and `npm run build`; verify the full suite is green and the build succeeds
- [x] 3.3 Bump `version` in `package.json` with a minor bump (user-visible ordering change) and verify the status bar shows the new `v<version>`
