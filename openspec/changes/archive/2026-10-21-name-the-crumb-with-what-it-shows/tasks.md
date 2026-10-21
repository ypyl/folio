# Tasks

## 1. The day's crumb is named with the file name it shows

- [x] 1.1 In `StatusBar`, name a journal day's crumb with the file name the crumb
  prints — `Show <file name> in the Journal calendar` — and drop the date
  formatting it no longer needs. Verify `StatusBar.test.tsx`: a journal path
  renders one control whose accessible name contains the text it displays and
  names the Journal calendar, clicking it still reports the locate, and a page's
  name, a board's, an asset's, and an empty bar are unchanged.
- [x] 1.2 In `months.ts`, make `dateLabel` module-private again now that the status
  bar is not a caller. Verify `tsc -b` passes and the App integration test names
  the day's cell with `dayLabel(new Date())`, the same function the calendar uses.

## 2. Docs, e2e, and version

- [x] 2.1 Update the status bar's header comment so the crumb's rule reads as
  "named with the text it displays" for both kinds. Verify it matches the spec
  requirement, and DESIGN.md needs no change (the crumb's look is untouched).
- [x] 2.2 Update the e2e in `tests/e2e/navigation.spec.ts` to activate the crumb by
  its new name, and verify the spec passes on a dev server started with
  `npm run dev:test`, then sweep with `npm run kill:dev`.
- [x] 2.3 Bump `version` in `package.json` (patch) and verify the status bar's
  version badge reads the new build.

## 3. Integration verification

- [x] 3.1 Run the whole unit and integration suite, `npx tsc -b`,
  `npx oxlint --deny-warnings --format=agent`, `npm run fmt:check`, and
  `npm run build`; verify all green.
- [x] 3.2 Run the whole e2e suite; verify all green and sweep left-over dev servers
  with `npm run kill:dev`.

## Workflow follow-up

- Archive the change with `/opsx-archive` after review, syncing the modified
  `workspace` requirement into the main spec.
