# Tasks

## 1. Issue templates

- [x] 1.1 Add `.github/ISSUE_TEMPLATE/bug_report.yml` as a GitHub issue form with
      what happened, steps to reproduce, Folio version (optional), browser, and
      console errors, and verify it parses as YAML with `python -c "import yaml,sys; yaml.safe_load_all(open(p))"`
- [x] 1.2 Add `.github/ISSUE_TEMPLATE/feature_request.yml` as a GitHub issue form
      with the problem and the proposed behavior, and verify it parses as YAML
- [x] 1.3 Add `.github/ISSUE_TEMPLATE/config.yml` turning blank issues off, and
      verify the three files are the only entries in the directory

## 2. The rail's feedback control

- [x] 2.1 Add the feedback anchor to `FolderRail`'s bottom group above the tour
      control, with its URL as a module constant, `target="_blank"`, and
      `rel="noopener noreferrer"`, and verify it renders with no folder, while
      restoring, and with folders listed in `FolderRail.test.tsx`
- [x] 2.2 Add the speech-bubble glyph and the control's styling in
      `FolderRail.module.css` (tour surface, brand tint on hover, 40px box, 48px
      under the compact breakpoint), and verify the file has no new color token
      and the control keeps the rail's control size
- [x] 2.3 Verify the accessible name and new-tab attributes in
      `FolderRail.test.tsx` and add the same check to `tests/e2e/workspace.spec.ts`

## 3. Docs

- [x] 3.1 Add the control's recipe to `DESIGN.md` beside the brand-screen rules,
      and verify the paragraph names the control's place, surface, glyph size, and
      the compact shell's target size
- [x] 3.2 Mention how to report a bug or a feature in `README.md` if the guide does
      not already say where issues go, and verify the sentence names the in-app
      control

## 4. Integration checks

- [x] 4.1 Run `npx oxlint --deny-warnings --format=agent`, `npm run fmt:check`,
      `tsc -b`, `npm test`, `npm run build`, and `npm run test:e2e` (with
      `npm run dev:test` and `npm run kill:dev`), and verify all of them pass

## Workflow follow-up

- Sync the `workspace` spec from the delta and archive the change.
- Bump `package.json` (minor for the feature commit, patch for the archive),
  regenerate `CHANGELOG.md`, push `master` to `origin` and `nas`, and publish the
  `v<version>` GitHub Release at the feature commit.
