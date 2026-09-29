## 1. Bottom-align the collapsed link sections

- [x] 1.1 In `src/components/MetaPanel.tsx`, wrap the Backlinks and Forwardlinks `Accordion`s in one group element (a `div` with a `links` class) so the panel can treat them as a unit; verify the MetaPanel tests still find the sections in order (Contents, Backlinks, Forwardlinks, Keyboard shortcuts)
- [x] 1.2 In `src/components/MetaPanel.module.css`, style the group to take the panel's remaining height and bottom-align its collapsed children (`flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; justify-content: flex-end`), leaving the open-section sharing and the footer's bottom anchoring unchanged; verify `src/scrollRegions.test.ts` still passes
- [x] 1.3 Add a `MetaPanel` test asserting that with Backlinks and Forwardlinks collapsed, their summaries sit in the link group directly above the keyboard-shortcuts row (the group is the element that precedes the shortcuts `details`); verify the test passes

## 2. Verification

- [x] 2.1 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`; verify all pass
- [x] 2.2 Run `npm test`; verify the full suite is green
- [x] 2.3 Run `npm run build`; verify type-check and production build succeed
- [x] 2.4 Bump `version` in `package.json` with a patch bump and verify the status bar shows the new `v<version>`
