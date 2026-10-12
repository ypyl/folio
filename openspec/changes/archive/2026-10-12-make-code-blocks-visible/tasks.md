# Tasks

## 1. Paint the panel

- [x] 1.1 In `render(view)` (`src/editor/codemirror.ts`), emit a
  `Decoration.line` with a panel class for every line of each visible
  `FencedCode` node, and add a first/last role class to the node's first and
  last line. Verify with an integration test that a three-line fence yields the
  panel class on all three lines and the role classes on the opening and closing
  lines only.
- [x] 1.2 Clamp the per-line loop to `view.visibleRanges` lines and attach a role
  class only to the node's true first/last line when that line is visible.
  Verify with a test where the fence's opening line is scrolled out of view:
  the visible lines carry the panel class and no top role class.

## 2. Style the panel

- [x] 2.1 Add the panel classes to `folioTheme` (`src/editor/codemirror.ts`):
  `--ivory` (`#faf9f5`) fill, horizontal padding on every line, vertical padding
  on the first/last line, and 8px top/bottom radius on the role lines. Remove the
  background from the existing `.folio-cm-fence` rule so the line is the only
  fill. Verify the fill hex matches `--ivory` in `src/index.css`/DESIGN.md and
  add a comment tying the hex to the token, as `codeHighlight.ts` does.
- [x] 2.2 Confirm a fence with no language still renders monochrome while
  wearing the panel, by updating the existing "leaves a language-less fence
  monochrome" test to also expect the panel class on its lines.

## 3. Integration checks

- [x] 3.1 Extend `src/editor/codemirror.integration.test.ts` with the panel
  scenarios from the `editing` delta spec: a fenced block reads as a full-width
  panel, the panel is presentational (an unrelated save leaves the fence
  unchanged), and the fence lines remain visible and editable.
- [x] 3.2 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings
  --format=agent`, the unit and integration test projects, and `npm run build`;
  all must pass.
- [x] 3.3 Bump `version` in `package.json` (patch) and confirm the status bar
  shows the new `v<version>`.
