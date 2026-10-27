# Tasks

## 1. The notice

- [x] 1.1 Add the `demo` prop to `EditorPane`, render the sticky notice in both
      the page and loading branches, and verify `EditorPane.integration.test.tsx`
      shows it when `demo` is true and hides it when false.
- [x] 1.2 Pass `demoActive` from `App` and verify `App.integration.test.tsx`
      shows the notice on the demo's Welcome page and on a guide page, and not
      for a real folder.
- [x] 1.3 Style the notice with the brand tint, a brand `Demo` label, and the
      sticky placement; verify in the browser that it stays at the top while a
      long page scrolls.

## 2. Integration

- [x] 2.1 Extend `tests/e2e/demo.spec.ts` to assert the notice is visible on
      the Welcome page and still visible after scrolling the editor pane, and
      verify the full e2e suite passes.
- [x] 2.2 Run `npm run test`, `npx tsc -b`, `npx oxlint --fix`, `npm run fmt`,
      `npx oxlint --deny-warnings --format=agent`, `npm run build`, and
      `npm run test:e2e`.

## Workflow follow-up

- Sync the delta spec into `openspec/specs/demo/spec.md`, archive the change,
  bump `package.json` for the feature and archive commits, and push `master` to
  `origin` and `nas`.
