## 1. The menu

- [x] 1.1 In `src/editor/boardView.tsx`, destructure `MainMenu` alongside `Excalidraw` from the loaded module and pass a `MainMenu` child to `<Excalidraw>` that renders the fallback's items (`LoadScene`, `SaveToActiveFile`, `Export`, `SaveAsImage`, `SearchMenu`, `Help`, `ClearCanvas`, `Separator`, `ToggleTheme`, `ChangeCanvasBackground`) and omits the "Excalidraw links" group. Verify `npm run build` type-checks and compiles.
- [x] 1.2 Bump `version` in `package.json` (patch — chrome trim, no new capability).

## 2. Verification

- [x] 2.1 Browser check on a fresh `npm run dev:test` server (confirm the log says `ready in`): open a board, open the editor's main menu, and confirm open, save, export, save-as-image, find-on-canvas, help, clear canvas, theme, and canvas background are present and working, with no GitHub, X, or Discord link and no "Excalidraw links" heading, and a single hairline between clear canvas and theme. Run `npm run kill:dev` afterward.
- [x] 2.2 Run `npx oxlint --fix`, `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`, `npm run build`, and the full test suite; verify all pass.
