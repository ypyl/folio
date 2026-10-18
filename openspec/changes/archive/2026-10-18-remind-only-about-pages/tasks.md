# Tasks

## 1. Restrict the reminder target to a page

- [x] 1.1 In `App`, compute `reminderTarget` only when the open item's kind is `page`, so a journal day offers no reminder items; an App integration test opens a journal day, right-clicks a day, and asserts no day menu, and a Sidebar test asserts no menu when `reminderTarget` is null. Verify the tests pass.
- [x] 1.2 Update the README's Reminders line if it implies a journal day can be a target, and bump `version` in `package.json` (patch). Verify the version reads as a distinct build.

## 2. Integration verification

- [x] 2.1 Run the whole unit and integration suite, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`, and `npm run build`; verify all green.
- [x] 2.2 Run the reminder e2e spec and the whole e2e suite; verify all green and sweep dev servers with `npm run kill:dev`.

## Workflow follow-up

- Archive the change with `/opsx-archive` after review.
