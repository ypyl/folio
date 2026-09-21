## 1. Default the canvas background

- [x] 1.1 Add `DEFAULT_BOARD_BACKGROUND = '#f5f4ed'` to `src/editor/boardScene.ts` with a comment pointing at `DESIGN.md`'s parchment token, and apply it in `parseScene` as `appState.viewBackgroundColor ?? DEFAULT_BOARD_BACKGROUND`. Verify with a `boardScene` test: a scene with no background gets `#f5f4ed`, and one carrying `#fffce8` keeps it.
- [x] 1.2 Record the board canvas's default in `DESIGN.md` (the parchment token, and why not Excalidraw's white), so the rule is documented where styling lives.

## 2. Verification

- [x] 2.1 Run `npx oxlint --fix`, `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`, and `npm run build`. Verify all pass.
- [x] 2.2 Run the full test suite (`npm test`) and confirm the new boardScene cases pass with no regressions.
