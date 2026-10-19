# Tasks

## 1. The preference

- [x] 1.1 Add `src/prerelease.ts` with `readPrerelease`/`writePrerelease` over `localStorage` and a `usePrerelease` hook; unit tests cover the default (off), persistence, and unavailable storage. Verify the tests pass.
- [x] 1.2 Make the effective reminder gate `features.reminders || prerelease` in `App`, and pass it to `Sidebar` as a prop; the Sidebar day menu reads the prop, not the module flag. Update the existing Sidebar and App tests. Verify the tests pass.

## 2. The rail control

- [x] 2.1 Add the prerelease control to `FolderRail` in a bottom group before the tour control, with `aria-pressed` and an accessible name; a component test asserts it renders in every state, toggles, and keeps the tour last. Verify the test passes.
- [x] 2.2 Wire `usePrerelease` in `App` to the rail control; an App integration test turns the mode on and sees the reminder day menu appear, then off and sees it gone. Verify the tests pass.
- [x] 2.3 Follow `DESIGN.md` for the control's tokens and focus state. Verify the stylesheet carries its rules and the scroll-region test still passes.

## 3. Docs and version

- [x] 3.1 Update the README: prerelease mode from the rail turns on reminders; the shipped build stays off. Bump `version` in `package.json` (minor). Verify the version reads as a distinct build.

## 4. Integration verification

- [x] 4.1 Run the whole unit and integration suite, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`, and `npm run build`; verify all green.
- [x] 4.2 Run the whole e2e suite; the reminder spec still forces `VITE_REMINDERS=1`, and verify all green and sweep dev servers with `npm run kill:dev`.

## Workflow follow-up

- Archive the change with `/opsx-archive` after review.
