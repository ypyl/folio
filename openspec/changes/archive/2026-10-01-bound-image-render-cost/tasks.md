# Tasks

## 1. Measurement (browser, ad hoc)

- [x] 1.1 Seed an OPFS-backed vault in-page with 20 canvas-drawn PNGs and a page referencing them, and drive Chromium with `playwright-cli` against `npm run dev:test`; verify the recipe is recorded in `design.md` → Measurements
- [x] 1.2 Record live vault images at open and after scrolling to the bottom, plus the read cap; verify the table shows the live set flat in N (3 at open, 5 at the bottom, against 20 before)
- [x] 1.3 Note honestly what was not measured (bytes: no `measureUserAgentSpecificMemory`/`performance.memory` available) in `design.md` → Measurements

## 2. Viewport-scoped resolution

- [x] 2.1 Replace the read-once cache in `src/editor/assetImages.ts` with per-path live state (a URL, the visible elements, an in-flight marker, a failed set) and an injected observer; verify unit tests for the pure decisions pass
- [x] 2.2 Cap concurrent vault reads with a small in-flight queue; verify a test asserts no more than the cap are read at once
- [x] 2.3 Release an image's object URL when it leaves the observer margin and re-resolve it on return; verify tests cover release, a shared path's refcount, and re-resolution, and that `releaseAssetImages` still revokes everything on unmount

## 3. Image element and styles

- [x] 3.1 Set `decoding="async"` on the element `src/editor/vaultImageView.ts` creates; verify `vaultImageView.test.ts` asserts it
- [x] 3.2 Gate the control's reveal on a `data-resolved` wrapper attribute in `src/components/EditorPane.module.css`, removing the `:has(> img[src^='blob:'])` rule; verify no `:has(` remains and the pane sets the attribute on resolve

## 4. Pane wiring

- [x] 4.1 Pass the pane's scroll container to `createAssetImages` as the observer root in `src/components/EditorPane.tsx`; verify `EditorPane.test.tsx` covers mount and enter/exit through a controllable observer
- [x] 4.2 Confirm the change-driven pass reads nothing (nothing is read until an image enters view); verify with unit and pane tests
- [x] 4.3 Add `adr/0028-image-resolution-is-viewport-scoped.md` recording the decision and its rejected alternatives, and add its row to `adr/README.md`; verify the README links a file that exists

## 5. Release

- [x] 5.1 Bump `version` in `package.json` (minor) and verify the status bar badge names the new version
- [x] 5.2 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, and `npm test`; verify the change's tests pass (6 pre-existing date-dependent failures in `JournalCalendar`/`App` are unrelated to this change)
- [x] 5.3 Commit and push to `master` (triggers the Pages deploy), then archive the change; verify the deploy workflow succeeds
