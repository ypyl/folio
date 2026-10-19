# Tasks

## 1. Refuse a past day

- [x] 1.1 Add a `today` prop to `Sidebar` (defaulting to the local day) and make `openDayMenu` return for a day before it; update the Sidebar day-menu tests to pin `today` and add a past-day case. Verify the tests pass.
- [x] 1.2 Add an App integration test: with a page open and the feature on, right-clicking a day before the frozen today opens no menu. Verify the test passes.

## 2. Docs and version

- [x] 2.1 Note in the README that a reminder is set for today or a later day, and bump `version` in `package.json` (patch). Verify the version reads as a distinct build.

## 3. Integration verification

- [x] 3.1 Run the whole unit and integration suite, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`, and `npm run build`; verify all green.
- [x] 3.2 Run the whole e2e suite; verify all green and sweep dev servers with `npm run kill:dev`.

## Workflow follow-up

- Archive the change with `/opsx-archive` after review.
