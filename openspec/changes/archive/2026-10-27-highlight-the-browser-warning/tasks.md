# Tasks

## 1. Warning callout

- [x] 1.1 Define `--breaking-bg` and `--breaking-fg` in `src/index.css` from
      DESIGN.md, and record the browser warning as their second sanctioned use
      in DESIGN.md.
- [x] 1.2 Replace the `browser-unsupported` tagline in `EditorPane` with the
      warning callout (icon, heading, body) and style it on the warning tint;
      verify `EditorPane.integration.test.tsx` shows the heading and body and
      that the supported and `notes` states do not.
- [x] 1.3 Update `App.integration.test.tsx` to expect the warning heading and
      body without a picker, and to confirm a supported browser shows no
      warning.

## 2. Integration

- [x] 2.1 Extend `tests/e2e/demo.spec.ts` to assert the warning heading is
      visible before the demo opens, and verify the warning's surface differs
      from the brand copy in the browser.
- [x] 2.2 Run `npm run test`, `npx tsc -b`, `npx oxlint --fix`, `npm run fmt`,
      `npx oxlint --deny-warnings --format=agent`, `npm run build`, and
      `npm run test:e2e`.

## Workflow follow-up

- Sync the delta spec into `openspec/specs/workspace/spec.md`, archive the
  change, bump `package.json` for the feature and archive commits, and push
  `master` to `origin` and `nas`.
