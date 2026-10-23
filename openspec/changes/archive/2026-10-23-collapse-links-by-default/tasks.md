# Tasks

## 1. The default

- [x] 1.1 In `src/components/MetaPanel.tsx`, drop `defaultOpen` from the Links section and update the comment that says it opens by default.
- [x] 1.2 In `src/components/MetaPanel.module.css`, let a closed Links band size to its summary row and give the freed height to Contents and its body (D2).
- [x] 1.3 Update the panel's default-state test to `[open, closed, closed]` and reword the case; keep the "collapsed Links sits above the shortcuts row" case green.

## 2. Docs and version

- [x] 2.1 Note the default in `README.md` if it describes the panel's sections, and bump `version` in `package.json` (minor).

## 3. Integration verification

- [x] 3.1 Run the whole unit and integration suite, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`, `npm run build`, and the e2e suite; sweep dev servers with `npm run kill:dev`.

## Workflow follow-up

- [x] 4.1 Archive the change with `/opsx-archive` after review.
