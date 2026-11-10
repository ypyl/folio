# Tasks

## 1. The trace ships in every build

- [x] 1.1 Delete `src/features.ts` and `src/features.test.ts`; in `src/App.tsx` drop the prerelease state, the `experiments` expression, and the imports, so the session memo is `rawStorage && !demoVault ? createSessionTrace(rawStorage) : null`; verify tracing tests pass without any switch.
- [x] 1.2 Retire prerelease mode: delete `src/prerelease.ts` and `src/prerelease.test.ts`, remove the rail control, its popup, its props, and their CSS from `FolderRail.tsx` and `FolderRail.module.css`, and the App wiring (`prerelease`, `onTogglePrerelease`, `experimental`); verify the rail's tests pass with the tour control last.
- [x] 1.3 Update `src/App.integration.test.tsx`: drop `switchOn`, delete the "no trace while the switch is off" and "turns tracing on from the rail" cases, and let the remaining trace cases assert the shipped behavior; verify the suite passes.
- [x] 1.4 Drop `VITE_TRACE` from `playwright.config.ts`, update `tests/e2e/diagnostics.spec.ts` to assert the trace with no switch, and delete `tests/e2e/workspace.spec.ts`'s experimental-control test; verify both suites pass.

## 2. The docs state the release

- [x] 2.1 Rewrite the README's Diagnostics section as a feature: what it writes, where, what it never writes, its retention, and that it runs for every real folder; verify it names no switch.
- [x] 2.2 Remove the "Experimental switch (rail control)" section from `DESIGN.md`, and replace ADR-0035's gate paragraph with the release decision; verify no doc still describes the switch.

## 3. Integration verification

- [x] 3.1 Run `npx oxlint --fix`, `npm run fmt`, `npx tsc -b`, `npm run test`, `npm run build`, the full e2e suite, and `npx oxlint --deny-warnings --format=agent`; all pass, and the e2e runs without `VITE_TRACE`.
- [x] 3.2 Bump `version` in `package.json` (minor: a hidden capability is now on) and commit the feature with its docs, delta specs, and deletions.

## Workflow follow-up

- Archive the change, retiring the `prerelease` spec and syncing the `diagnostics` and `workspace` deltas, with its own patch version bump.
- Push `master` to every remote (`origin`, `nas`).
