# Tasks

## 1. The repository link on the brand screen

- [x] 1.1 Render a link to `https://github.com/ypyl/folio` on the no-folder brand screen, below the import action's position, opening in a new tab. Extend the brand-screen test in `src/components/EditorPane.integration.test.tsx` to see it, and verify the test passes.
- [x] 1.2 Style the link from the app's design tokens (visible keyboard focus, no literal colors or shadows), and verify `npm run fmt` and `npx oxlint --deny-warnings` pass.
- [x] 1.3 Extend the e2e `workspace` happy path (`tests/e2e/workspace.spec.ts`) to assert the link is visible and names the repository, and verify `npm run test:e2e` passes.

## 2. Integration check

- [x] 2.1 Run `npx tsc -b`, `npm run test:unit`, and `npm run test:integration`, and verify all pass (the link must not disturb the no-folder assertions elsewhere).
