# Tasks

## 1. The gate and the rail's slot

- [x] 1.1 Gate `App`'s tour callback on the active demo vault and the wide viewport, drop the brand screen's, and verify `App.integration.test.tsx` covers both states
- [x] 1.2 Render the tour control or the feedback anchor, never both, in `FolderRail`'s bottom group, and verify `FolderRail.test.tsx` covers the demo, a real folder, no folder, and restoring

## 2. The brand screen

- [x] 2.1 Remove `EditorPane`'s `onTour` prop, its "New here? Take the tour" line, and `.tourLink`, and verify `EditorPane.integration.test.tsx` no longer passes it
- [x] 2.2 Add the wide-only footer line naming the guided demo and its rail's tour control, and verify its presence above the breakpoint and its absence at and below it

## 3. The tour's copy

- [x] 3.1 Rewrite the editor step's body to name the demo vault the tour is walking, and verify `tests/e2e/workspace.spec.ts` and the integration tests that assert the step's copy still pass

## 4. Tests

- [x] 4.1 Update `App.integration.test.tsx` and `src/tour` tests: the tour opens only with the demo active on a wide viewport, the brand screen opens nothing, and a real folder offers feedback instead
- [x] 4.2 Update `tests/e2e/workspace.spec.ts`: open the guided demo, take the tour from the rail, and check the brand screen and a real folder carry no tour control

## 5. Docs

- [x] 5.1 Update `DESIGN.md`: the rail's bottom slot holds the demo's tour or the feedback anchor, and the brand screen's footer carries the issue line and the tour pointer
- [x] 5.2 Update `README.md`'s tour and feedback lines to say the tour is taken from the guided demo's rail

## 6. Integration checks

- [x] 6.1 Run `npx oxlint --deny-warnings --format=agent`, `npm run fmt:check`, `tsc -b`, `npm test`, `npm run build`, and `npm run test:e2e` (with `npm run dev:test` and `npm run kill:dev`), and verify all of them pass

## Workflow follow-up

- Sync the `workspace` spec from the delta and archive the change.
- Bump `package.json` (minor for the feature commit, patch for the archive),
  regenerate `CHANGELOG.md`, push `master` and the tag to `origin` and `nas`, and
  publish the `v<version>` GitHub Release at the feature commit.
