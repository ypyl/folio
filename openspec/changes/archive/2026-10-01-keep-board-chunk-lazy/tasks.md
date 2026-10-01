# Tasks

## 1. Move the board chunk group off recursive dependency capture

- [x] 1.1 In `vite.config.ts`, replace `build.rollupOptions.output.manualChunks` with `build.rolldownOptions.output.codeSplitting.groups`: one board group with the existing package `test` (regexes for `@excalidraw/`, `@mermaid-js/`, `mermaid/`, `cytoscape`, `katex`), `name: 'excalidraw'`, and `includeDependenciesRecursively: false`. Verify with `npm run build` that the build succeeds.
- [x] 1.2 Verify the board chunk left the entry graph: from the fresh `dist/`, confirm no file directly imports `excalidraw-*.js` (a static import in the entry chunk) and confirm `dist/index.html` has no `modulepreload` link for `excalidraw-*.js`.

## 2. Keep the board out of the offline install

- [x] 2.1 From the fresh `dist/sw.js` precache manifest, confirm the `excalidraw-*.js` chunk is not precached and confirm no board-only dependency chunk (for example `roughjs`, `d3`, `pako`, `pica`, `image-blob-reduce`, `perfect-freehand`, `open-color`) is precached. Verification: the manifest holds no board-editor URL; if any board-only chunk appears, cover it in `globIgnores` (or add an app-vendor group) and rebuild.

## 3. Integration checks and the record

- [x] 3.1 Run `npx oxlint --deny-warnings --format=agent` (clean), `npm run fmt:check` (clean), and `npm test`: 1011 pass; the 6 failures are the pre-existing date-driven ones (App.test.tsx x3, JournalCalendar.test.tsx x3 hardcode September 2026, today is 2026-10-01), identical to HEAD and unrelated to this change.
- [x] 3.2 Browser check on the built app (`vite preview`, real Chromium): a clean startup fetches only the entry, runtime, and vendor chunks — no board chunk — with zero console errors, and the built board chunk's module graph imports on demand without error. Opening a real board requires the OS folder picker, which cannot be automated here; that gesture is unaffected by this change (no `src/` change) and remains a manual check.
- [x] 3.3 Bump `version` in `package.json` (patch) and confirm `npm run build` succeeds and the status bar's version badge shows the new version.
