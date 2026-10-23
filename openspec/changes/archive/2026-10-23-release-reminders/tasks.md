# Tasks

## 1. The occurrence no longer moves the view

- [x] 1.1 In `src/editor/codemirror.ts`, drop the `selection` and `scrollIntoView` from `appendMarkdown`'s dispatch so the insert leaves the caret and the scroll position alone; update the seam's doc comment in `src/editor/editor.ts`.
- [x] 1.2 Add a test in `src/editor/codemirror.integration.test.ts`: a note with content and a caret in its first line, appended to, keeps its text, gains the line at the end, and keeps the caret on line 1. Verify it fails against the old dispatch.

## 2. A page row shows its reminder

- [x] 2.1 In `src/components/Sidebar.tsx`, render a reminder marker on a page row whose label is in `reminderRules`, in the kind badge's treatment, `aria-hidden`, with a hover title; add the style to `src/components/Sidebar.module.css`.
- [x] 2.2 Cover it: a page with a rule shows the marker, a page without one does not, and the row's accessible name is unchanged (Sidebar integration test).
- [x] 2.3 Record the marker's rule in `DESIGN.md` beside the kind badge and the pin-star note.

## 3. The feature ships in every build

- [x] 3.1 Delete `src/features.ts` and un-gate the four call sites in `src/App.tsx` and `src/components/Sidebar.tsx` (the day menu, the row removal item, the badge, materialization), dropping the `remindersEnabled` prop and its `useMemo` dependencies.
- [x] 3.2 Retire prerelease mode: delete `src/prerelease.ts` and its test, remove the rail control, its props and CSS from `src/components/FolderRail.tsx` and `FolderRail.module.css`, and the App wiring and imports.
- [x] 3.3 Drop `VITE_REMINDERS` from `playwright.config.ts` and the App test setup's flag flips, and update the tests that asserted the disabled feature.
- [x] 3.4 Update `README.md`: the feature is available, not flagged, and the prerelease note goes.

## 4. Docs and version

- [x] 4.1 Bump `version` in `package.json` (minor: a hidden capability is now on).

## 5. Integration verification

- [x] 5.1 Run the whole unit and integration suite, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`, and `npm run build`; verify all green.
- [x] 5.2 Run the whole e2e suite without `VITE_REMINDERS`; verify all green and sweep dev servers with `npm run kill:dev`.

## Workflow follow-up

- [x] 6.1 Archive the change with `/opsx-archive` after review, syncing the main specs (the `prerelease` spec disappears with its last requirement).
