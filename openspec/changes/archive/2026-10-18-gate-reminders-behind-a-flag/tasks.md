# Tasks

## 1. Add the flag and gate the feature

- [x] 1.1 Add `src/features.ts` exporting `REMINDERS_ENABLED = false` with the PRESENT_ENABLED-style comment; a unit test asserts it is a boolean. Verify the test passes.
- [x] 1.2 Gate the day menu's reminder items in `Sidebar` on the flag; a Sidebar test asserts no menu when the flag is off. Verify the test passes.
- [x] 1.3 Gate the badge and the materialization in `App` on the flag; the existing reminder tests set the flag on (mock it) so the engine stays covered, and a new test asserts nothing is written with it off. Verify the tests pass.

## 2. Docs and version

- [x] 2.1 Note the flag in the README's Reminders section (the feature is off in the shipped build) and bump `version` in `package.json` (patch). Verify the version reads as a distinct build.

## 3. Integration verification

- [x] 3.1 Run the whole unit and integration suite, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`, and `npm run build`; verify all green.
- [x] 3.2 Run the whole e2e suite; the reminder spec must exercise the enabled feature, so it overrides the flag, and verify all green and sweep dev servers with `npm run kill:dev`.

## Workflow follow-up

- Archive the change with `/opsx-archive` after review.
