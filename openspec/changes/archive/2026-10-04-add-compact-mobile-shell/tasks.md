# Tasks

Note: `AGENTS.md` bumps `version` in `package.json` on every commit — a patch
bump for setup, tests, or docs, and the minor bump for the new user-facing
capability on the commit that lands group 2.

Browser checks start a dev server with `npm run dev:test` (an OS-picked port that
the log names), confirm the log says `ready in`, and sweep leftovers with
`npm run kill:dev`. A check that ran against a stale server is not evidence.

## 1. Spike and platform setup

- [x] 1.1 Run the File System Access spike on a real Android Chrome 132+ device:
  open a Markdown folder with the picker, confirm the app indexes it, edit and
  save a page, reload, and confirm the stored handle re-grants or demands a fresh
  gesture. **Run on a Pixel 9a, Android 17, Chrome 154.0.8037.92**, against
  `http://localhost:5199` reached over `adb reverse` (localhost is a secure
  context, so the API is available). `showDirectoryPicker` is a function and
  `isSecureContext` is true. The picker opened at the folder last used, `Use
  this folder` was confirmed, and Chrome then asked twice more — `Allow Chrome
  to access folder?` and then `Allow this site to edit files?`, the second
  stating the grant lasts "until you close all tabs for this site". The app then
  indexed the folder, opened today's journal, read its Markdown, and wrote an
  edit back: `/sdcard/Documents/folio-vault/journals/2026-10-04.md` gained the
  typed text. After a reload the handle was restored from IndexedDB but
  `queryPermission` reported `prompt`, so the folder was listed and not open —
  tapping the rail entry re-granted it with no picker and the vault reopened,
  which is exactly the reconnect path the folder-rail requirement already
  specifies. The grant lifecycle on Android is recorded in ADR-0002.
- [x] 1.2 Add `viewport-fit=cover` and `interactive-widget=resizes-content` to the
  viewport meta in `index.html`, and move `#root` from `100svh` to `100dvh`.
  Verify with `npm run build` and a browser check at 390x844 that the shell fills
  the viewport in both the wide and compact layouts.
- [x] 1.3 Add a touch-target and safe-area rule to `DESIGN.md` (44x44 CSS pixel
  minimums, `env(safe-area-inset-*)` usage, non-scrolling single-row app bar).
  Verify the rule is stated as a rule and not as a per-component note, matching
  the style of the existing Scroll regions rule.

## 2. The compact composition

- [x] 2.1 Declare the breakpoint once as a JS constant and once as the
  `max-width` media query in `src/index.css`, and add a test that reads the
  stylesheet from disk and asserts the two agree (following
  `src/scrollRegions.test.ts`). Verify the test fails when either number is
  changed alone.
- [x] 2.2 Wrap the folder rail and the sidebar in one navigation element whose
  wide-viewport style is `display: contents`, so the six-column grid sees the
  same children as today. Verify every existing `workspace` test and
  `App.integration.test.tsx` case passes unchanged, and that no rule in
  `src/index.css` or the pane stylesheets needed editing to keep the wide layout
  identical.
- [x] 2.3 Add the compact view state and the landing rule to `App.tsx` (no page
  open -> navigation view, page open -> editor view) with the state held in
  memory only. Verify with unit tests covering both landing cases, that selecting
  a row returns to the editor view, and that a reload re-derives the view from
  the landing rule rather than restoring it.
- [x] 2.4 Add the compact layer styles: the navigation element and the meta panel
  become absolutely positioned full-size layers over the workspace's content
  area, the inactive layer is `display: none`, the editor keeps its grid slot and
  full content size, and both `PaneCollapseToggle` strips are hidden. Verify with
  a browser check at 390x844 and 360x640 that only one view is visible, that the
  editor is never zero-sized, and that no horizontal scrollbar appears.
- [x] 2.5 Hide the editor with `visibility: hidden` while a layer is shown — it
  keeps its box, so CodeMirror never re-measures, and leaves the tab order — and
  hand focus back to the editor when a view closes. Verify with a browser check
  that the editor is hidden while a layer covers it and visible again after, that
  the bar's controls all meet the touch minimum, and with a test that focus
  returns to the editor on the close.
- [x] 2.6 Amplify `adr/0005-keep-ui-small-three-pane-layout.md` with the compact
  composition and the alternatives the design rejects (true swap, zeroed track,
  scrimmed drawer, router view stack), and add the Chrome for Android 132+ line
  to `adr/0002-chromium-first-pwa-file-system-access.md`. Verify both read as
  amendments to the existing decision rather than as new records, and that
  `adr/README.md` needs no status change.

## 3. History integration

- [x] 3.1 Push a history entry when a view is shown and return to the editor
  view on `popstate`, so the device's Back button and Back gesture close the view
  instead of leaving the app. Verify with an integration test that Back with a
  view shown returns to the editor view and Back with the editor view shown is
  left to the browser.
- [x] 3.2 Do not stack entries when the same view is shown again, and make the
  shown view's own control return to the editor and pop the entry it pushed.
  Verify with a test that one activation pushes exactly one entry, that closing
  pushes none, and that a view the landing rule chose (never pushed) closes
  without stepping the browser back.

## 4. The compact app bar

- [x] 4.1 Add the navigation and meta view controls to `StatusBar` as optional
  controls at the bar's two ends, exposed in both compositions and hidden above
  the breakpoint by CSS, with each control reporting whether its view is the one
  shown. Verify with tests that the controls render, that each carries an
  accessible name and its shown state, and that activating one shows its view.
- [x] 4.2 Give the compact bar its own content: the view controls, Back,
  Forward, Today, and the open item's name, with the breadcrumb path, the folder
  statistics and the version omitted, in a single non-scrolling row. Verify with
  tests for the compact composition's content and a browser check at 360px that
  the row does not overflow or wrap.

## 5. Integration checks

- [x] 5.1 Run `npx oxlint --fix`, then `npm run fmt`, then
  `npx oxlint --deny-warnings --format=agent`, and confirm all three are clean.
- [x] 5.2 Run the full test suite and `npm run build`, and confirm the wide
  composition's coverage thresholds and every existing `workspace` scenario still
  hold.
- [x] 5.3 Run the end-to-end pass on the real device: open a vault, land on the
  navigation view, open a page, use both view controls, dismiss each with Back
  and with the Back gesture, open the on-screen keyboard and confirm the shell
  shrinks and the caret stays visible, and confirm no control sits under a
  notch or the home indicator. **Run on the same Pixel 9a.** The shell landed on
  the navigation view with nothing open and on the editor view once the journal
  opened. Every app-bar control measured 44x44 (Today 55x44), and
  `env(safe-area-inset-bottom)` resolved to a real 24px, applied as the bar's
  padding. Each view control showed its view (navigation `display: grid`, meta
  `display: block`, the editor `visibility: hidden`), and the device Back button
  closed each one, leaving the app on `http://localhost:5199/` with the open page
  intact. Tapping the editor raised the keyboard (`mInputShown=true`): the shell
  shrank from 809 to 404 CSS pixels, the bar rode up to sit above the keyboard,
  and the caret sat at y=7-25 well inside what remained; Back then dismissed the
  keyboard first and left the app unchanged, the trade-off design D3 accepts.
- [x] 5.4 Confirm the wide composition is unchanged in a browser at 1280px and
  1920px: both strips fold and unfold, the fold state still resets on reload,
  and no compact control is visible.
