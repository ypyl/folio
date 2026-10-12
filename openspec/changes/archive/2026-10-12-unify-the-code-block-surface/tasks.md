# Tasks

## 1. Unify the code surface

- [x] 1.1 In `src/editor/codemirror.ts`, set the `.folio-cm-code` panel fill to
  `--inline-code-bg` (`#f0eee6`) and align the `tags.monospace` highlight fill to
  the same hex, so the text-width pill and the full-width panel are one surface.
  Verify with a test that the injected theme declares the `.folio-cm-code` fill
  as the code-surface hex and the panel class is still present on every block
  line.
- [x] 1.2 Update DESIGN.md's Code entry (the block shares the warm-gray code
  surface, not a lifted ivory fill) and the `--inline-code-bg` row to say inline
  pills and block panels share it. Verify the wording matches the code and no
  other DESIGN.md rule is contradicted.

## 2. Integration checks

- [x] 2.1 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings
  --format=agent`, the unit and integration test projects, and `npm run build`;
  all must pass.
- [x] 2.2 Bump `version` in `package.json` (patch) and confirm the status bar
  shows the new `v<version>`.
