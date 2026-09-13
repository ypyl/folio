## 1. Surface geometry

- [x] 1.1 In `src/components/EditorPane.module.css`, make `article.document` a flex column at least the pane's height, the editor host grow into it, and the ProseMirror surface grow with the host (design D1), each rule carrying a comment naming what it is for; verify every declaration uses an existing token and no new color is introduced.
- [x] 1.2 Verify the document's own geometry did not move, in a browser at desktop width: the first block's top and left, the prose column's width, and the gutter numbers are identical to before the change (`git stash` the stylesheet to compare), and an empty page still shows its placeholder at the top of the surface.

## 2. The gesture

- [x] 2.1 Verify in a browser with a real vault: with a page whose content ends well above the pane's bottom, clicking the empty space below the last block places the caret at the end of the page, and typing appends to that page's file without creating a block or touching any other page.
- [x] 2.2 Verify the neighbouring gestures are untouched: clicking the badge of a reference still opens its target, clicking beside a short last line places the caret without activating anything, drag-and-drop and paste still work, and a page whose content exceeds the pane scrolls as before.

## 3. Gates

- [x] 3.1 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent`; verify all three are clean.
- [x] 3.2 Run `npm test` and `npm run build`; verify both pass — this change adds no test cases, so the suite must be green unchanged.
