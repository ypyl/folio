# Tasks

## 1. The branch

- [x] 1.1 In `src/vault/assetOpen.ts`, remove `svg` from `DISPLAYABLE`. Verify: `isDisplayable('assets/chart.svg')` is false and `mimeFor` still answers for the types that stay.
- [x] 1.2 Pin the decision in `src/vault/assetOpen.test.ts`: an SVG takes the download branch and opens no window (`openTab` is not called), while a PDF still opens a window and an archive still downloads. Verify: `npx vitest run --project unit src/vault/assetOpen.test.ts`.

## 2. The record

- [x] 2.1 In `adr/0021-vault-files-open-as-derived-copies.md`, drop SVG from the decision's displayable list and replace the opaque-origin consequence with the real rule: a `blob:` document has the creator's origin, and a scriptable type is downloaded instead of shown. Verify: the ADR still reads as one decision, and `adr/README.md` needs no new row (no new file).

## 3. Version and verification

- [x] 3.1 Bump `version` in `package.json` (minor). Verify: `git diff` shows the bump.
- [x] 3.2 Run the unit and integration suite, `npx tsc -b`, `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npm run build`, and the e2e suite. Sweep dev servers with `npm run kill:dev`. Verify: every command exits clean.

## Workflow follow-up

- Archive the change with `/opsx-archive`, sync the main spec, and publish both commits.
