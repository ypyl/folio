# Tasks

## 1. The written line

- [x] 1.1 In `src/App.tsx`'s `handleEditorReady`, append a task item instead of a bare reference: `- [x] ` + `referenceToken(rule.target, 'word')` per rule, and state in the comment why the marker is written with the line (it is the control that records the reminder as done). Verify: `src/App.integration.test.tsx` asserts the written line is `- [x] #[[Take pills]]`.
- [x] 1.2 Keep `unreferencedRules` keyed on references, so a note holding a bare `#[[Page]]` line still gets no second line. Verify: `src/rows.test.ts` still passes unchanged.

## 2. Tests

- [x] 2.1 Update the materialize scenarios in `src/App.integration.test.tsx`: the day gains `- [x] #[[Take pills]]`, reopening adds nothing, a ticked line survives a reopen, and a single-word page writes `- [x] #word`.
- [x] 2.2 Cover the tick end to end: open a day that materializes a reminder, tick the box, and assert the saved note holds `- [x] #[[Take pills]]` and the badge count dropped to zero. Verify: the suite passes with the existing badge helpers.

## 3. Docs and version

- [x] 3.1 Amend `adr/0032-a-due-reminder-is-written-on-open.md`: the line written is an unchecked task item, so ticking it is the record. Verify: the ADR still reads as one decision and `adr/README.md` needs no new row.
- [x] 3.2 Bump `version` in `package.json` (minor: the written line changes what the user sees and can do). Verify: `git diff` shows the bump.

## 4. Integration verification

- [x] 4.1 Run the unit and integration suite, `npx tsc -b`, `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npm run build`, and the e2e suite. Sweep dev servers with `npm run kill:dev`. Verify: every command exits clean.

## Workflow follow-up

- [x] 5.1 Archive the change with `/opsx-archive`, sync the main spec, and publish both commits to `origin` and `nas`.
