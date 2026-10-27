# Tasks

## 1. Delete the timer

- [x] 1.1 In `src/vault/useIndex.ts`, remove `REFRESH_INTERVAL_MS`, the `setInterval`, and its visibility gate. Keep the focus and visibility listeners and the single build path. Verify: `grep -n setInterval src/vault/useIndex.ts` finds nothing.
- [x] 1.2 Update the file's header comment and the effect comment to name the triggers (open, focus, visible) instead of the interval.

## 2. Tests

- [x] 2.1 In `src/vault/useIndex.integration.test.ts`, replace the two interval tests with one that advances fake time by ten minutes on a visible tab and asserts the storage is not listed again. Keep the focus and visibility tests unchanged.
- [x] 2.2 Confirm `src/vault/scanCost.test.ts` still records one refresh's call count (one stat pair per page), which is the measurement the design cites. Verify: `npx vitest run --project unit src/vault/scanCost.test.ts`.

## 3. Version and verification

- [x] 3.1 Bump `version` in `package.json` (minor). Verify: `git diff` shows the bump.
- [x] 3.2 Run the unit and integration suite, `npx tsc -b`, `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npm run build`, and the e2e suite. Sweep dev servers with `npm run kill:dev`. Verify: every command exits clean.

## Workflow follow-up

- Archive the change with `/opsx-archive`, sync the main spec, and publish both commits.
