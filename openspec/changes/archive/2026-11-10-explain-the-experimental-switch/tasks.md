# Tasks

## 1. Describe the gated features

- [x] 1.1 Add `ExperimentalFeature` and `experimentalFeatures` to `src/features.ts` with the session trace's label and detail, and a coverage test in `src/features.test.ts` that fails when a key of `features` has no entry and when an entry names no key; `npx vitest run src/features.test.ts` passes.

## 2. Show the descriptions on the control

- [x] 2.1 Add the popup to `FolderRail` (`experimental` prop, hover/focus state, fixed anchor, `aria-describedby`, no popup when the list is empty) and its CSS in `FolderRail.module.css` using the floating-surface recipe; verify with `FolderRail.test.tsx` cases for hover, keyboard focus, leaving, the description reference, and an empty list.
- [x] 2.2 Pass `experimentalFeatures` from `App.tsx` to the rail; verify the app integration suite still renders the rail and flips the switch.

## 3. The recorded contract

- [x] 3.1 Record the floating-surface recipe and the popup in `DESIGN.md` only where the rail's control section already speaks (one line, no new section); verify the design doc and the CSS agree.

## 4. Full circle

- [x] 4.1 Run `npx oxlint --fix`, `npm run fmt`, `npx tsc -b`, `npm run test`, `npm run build`, the e2e suite with a hover assertion that the popup lists the gated feature and lands right of the rail, and `npx oxlint --deny-warnings --format=agent`; all pass.
- [x] 4.2 Bump `version` in `package.json` (patch) and commit the feature with its tests, docs, delta spec, and design changes.

## Workflow follow-up

- Archive the change, syncing the `prerelease` delta into `openspec/specs/`, with its own patch version bump.
- Push `master` to every remote (`origin`, `nas`).
