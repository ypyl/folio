# Tasks

## 1. The editor step's copy

- [x] 1.1 Change the editor step's `body` in `src/tour/steps.ts` to name the reference forms — `#word` and `#[[Page]]` for a page, and `#!word` for a board, noting that referencing something new creates it on first save — and add an assertion to `src/components/Tour.test.tsx` that the editor step names both `#` and `#!`. Verify `npm run test:unit` passes.
- [x] 1.2 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent`, and verify all pass.

## 2. Integration checks

- [x] 2.1 Run `npx tsc -b`, `npm run test:unit`, `npm run test:integration`, and `npm run build`, and verify all pass together.
- [x] 2.2 Bump `version` in `package.json` (patch, copy only) and run `npx oxlint --deny-warnings --format=agent`, `npm run test:unit`, and `npm run test:integration`, all green.
