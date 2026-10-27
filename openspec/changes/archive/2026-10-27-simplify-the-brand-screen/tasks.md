# Tasks

## 1. Markup and copy

- [x] 1.1 In `src/components/EditorPane.tsx`, replace `BRAND_FACTS` with a
      `BRAND_FACTS` array of `{ label, detail }` pairs and shorten
      `BRAND_DESCRIPTION` to the one-sentence introduction from the design.
- [x] 1.2 Restructure the settled no-folder block into hero (mark, `<h1>`
      headline, introduction), actions (demo, `brandAction`), facts `<ul>`, and
      footer (tour line, repository line). Keep the `browser-unsupported` warning
      and the `notes` hint exactly as they are.
- [x] 1.3 Move the brand-screen content into the scroll-safe centered wrapper so
      a short pane scrolls instead of clipping.

## 2. Styling

- [x] 2.1 In `src/components/EditorPane.module.css`, style the hero (72px mark,
      20px/600 near-black headline, 14px introduction), the actions row, the
      facts grid (`repeat(auto-fit, minmax(140px, 1fr))`, 460px cap, 13px/600
      labels over 12px stone details), and the 12px stone footer; delete the old
      `.brandInfo` rule.
- [x] 2.2 Add the brand-screen recipe to `DESIGN.md` (hero, actions, facts row,
      footer; no icons, no cards) beside the existing warning note.

## 3. Tests

- [x] 3.1 Update `src/components/EditorPane.integration.test.tsx`,
      `src/App.integration.test.tsx`, and `tests/e2e/workspace.spec.ts` to assert
      the new introduction and the three facts, and to assert the facts render as
      list items and that the headline is a heading.
- [x] 3.2 Check the screen in a browser at a wide window and at a phone-sized
      one (`npm run dev:test`), confirming three facts in one row wide and one
      column narrow, and no clipping on a short window; sweep with
      `npm run kill:dev`.

## 4. Verification

- [x] 4.1 Run `npm run test`, `npx tsc -b`, `npx oxlint --fix`, `npm run fmt`,
      `npx oxlint --deny-warnings --format=agent`, `npm run build`, and
      `npm run test:e2e`.
- [x] 4.2 Bump `package.json` (minor) for the feature commit.

## Workflow follow-up

- Sync the delta spec into `openspec/specs/workspace/spec.md`, archive the
  change, bump `package.json` for the archive commit, and push `master` to
  `origin` and `nas`.
