## 1. Capability probe

- [ ] 1.1 In `src/vault/fs.ts`, add `canOpenFolders()` next to `pickVaultFolder`, returning whether `window.showDirectoryPicker` is a function, with a comment naming why it is a function read at render time rather than a cached constant (design D1); verify `npx vitest run src/vault/fs.test.ts` passes and that the existing `pickVaultFolder` cases are untouched.
- [ ] 1.2 Add a case to `src/vault/fs.test.ts` covering both answers, stubbing and unstubbing `showDirectoryPicker`; verify the case fails if the probe is made a module-level constant.

## 2. Conditional rail control

- [ ] 2.1 In `src/App.tsx`, call `canOpenFolders()` during render, pass `onAdd` only when it answers true, and pass the new `emptyHint` variant when it answers false; verify `npx vitest run src/App.test.tsx` fails nowhere that already stubs the picker, and that the failure it does produce is only the unsupported-browser cases below.
- [ ] 2.2 In `src/components/FolderRail.tsx`, make `onAdd` optional and render the add control only when it is present, matching the pin control's shape in `StatusBar` (design D2); verify the rail still renders its `<nav>` with its column and entries when `onAdd` is absent.
- [ ] 2.3 In `src/components/FolderRail.test.tsx`, add the no-`onAdd` case asserting the rail renders no add control and keeps its entries; verify the suite passes.

## 3. Brand-screen notice

- [ ] 3.1 In `src/components/EditorPane.tsx`, extend the `emptyHint` union with the unsupported variant and render the browser-requirement copy in place of the open-folder tagline for it (design D3), as a plain paragraph in the existing tagline styling with no new role; verify no new color or token is introduced.
- [ ] 3.2 Update `src/components/EditorPane.test.tsx`: stub the picker for the case that asserts "Open a folder to begin.", and add a case asserting the requirement copy and the absence of that tagline when the picker is missing; verify the suite passes.
- [ ] 3.3 Update `src/App.test.tsx`: stub the picker in the shell-chrome case that asserts "Open a folder to begin." and add a case asserting that, with no picker, the shell shows the requirement copy and no "Add folder" control anywhere; verify the suite passes.

## 4. Gates

- [ ] 4.1 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent`; verify all three are clean.
- [ ] 4.2 Run `npm test` and `npm run build`; verify both pass.
- [ ] 4.3 Firefox smoke: open the built app in Firefox, confirm the rail shows no add control and the brand screen states the browser requirement, and confirm the rest of the shell is inert rather than broken; then repeat in Chrome to confirm the add control and the open-folder tagline are unchanged.
