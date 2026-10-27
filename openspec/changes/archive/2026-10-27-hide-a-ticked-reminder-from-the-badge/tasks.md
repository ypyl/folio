# Tasks

## 1. The reader

- [x] 1.1 In `src/vault/reminders.ts`, add `doneTargets(content: string): Set<string>`: a lowercased page name per reference that sits on a done task item line, read with the shared `findReferenceRanges` scanner. Verify: `src/vault/reminders.test.ts` covers `- [x] #[[A b]]`, `- [X] #a`, a nested item, and the three non-forms (prose, `- [x]no-space`, a bare `[x]` line).
- [x] 1.2 Record in the function's comment what it approximates (a fenced line that spells the form, and a continuation line of a done item) so the drift is stated where the code is.

## 2. The badge

- [x] 2.1 In `src/App.tsx`, read the open day's page from the graph and memoize the count on its identity: matching rules minus those whose target `doneTargets` holds. Verify: a save of the day changes the count, an index refresh with unchanged content does not rescan.
- [x] 2.2 Cover the spec's scenarios in `src/App.integration.test.tsx`: a ticked line clears the badge, one of two ticked shows one, an unticked line and a plain reference keep the count, a done item naming another page changes nothing, and unticking plus saving brings the reminder back. Verify: the suite passes.

## 3. Docs and version

- [x] 3.1 Amend `adr/0032-a-due-reminder-is-written-on-open.md`: the badge sentence gains the done-item exception and the consequences name the save lag. Verify: the ADR still reads as one decision and `adr/README.md` needs no new row (no new file).
- [x] 3.2 Bump `version` in `package.json` (minor). Verify: `git diff` shows the bump.

## 4. Integration verification

- [x] 4.1 Run the unit and integration suite, `npx tsc -b`, `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npm run build`, and the e2e suite. Sweep dev servers with `npm run kill:dev`. Verify: every command exits clean.

## Workflow follow-up

- Archive the change with `/opsx-archive`, sync the main spec, and publish both commits.
