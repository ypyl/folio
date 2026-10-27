# Tasks

## 1. The day check

- [x] 1.1 In `src/vault/logseqImport.ts`, add a helper that answers the day a page stem names: `humanDateToDay(stem)` first, then the app's `journalDayName(stem)`. Verify: unit cases for `Apr 30th, 2025`, `2025-04-30`, `2025-02-30` (not a day), and an ordinary name.
- [x] 1.2 Route a page source whose stem names a day into the journal grouping (`journals/<day>.md`) instead of `pages/<normalized>.md`. Verify: `runLogseqImport` writes the two name shapes there.
- [x] 1.3 Use the same helper in `outputNameFor`, so a block reference into such a page names the day. Verify: a `((uuid))` pointing at a block on `Apr 30th, 2025` imports as `#[[2025-04-30]]`.

## 2. Tests

- [x] 2.1 In `src/vault/logseqImport.test.ts`, cover: the human-date page, the zero-padded page, a day page folding with a journal source into one file, a reference to the day page resolving to the day, and the block-reference owner. Verify: `npx vitest run --project unit src/vault/logseqImport.test.ts`.

## 3. Version and verification

- [x] 3.1 Bump `version` in `package.json` (minor). Verify: `git diff` shows the bump.
- [x] 3.2 Run the unit and integration suite, `npx tsc -b`, `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npm run build`, and the e2e suite. Sweep dev servers with `npm run kill:dev`. Verify: every command exits clean.

## Workflow follow-up

- Archive the change with `/opsx-archive`, sync the main spec, and publish both commits.
