## 1. The chrome override

- [x] 1.1 Add a scoped `:global(.excalidraw)` block to `src/editor/boardView.module.css` mapping the accent family (`--color-primary` and its darker/hover/light/container variants, `--color-selection`, `--color-brand-*`, `--color-logo-text`) to the brand ink-blue and `--brand-tint`, deriving the darker shades with `color-mix`. Verify in the browser check that the active-tool accent is ink-blue and no violet remains.
- [x] 1.2 In the same block, map the surface family (`--island-bg-color`, `--default-bg-color`, `--color-surface-lowest/low/mid/high`, `--input-bg-color`, `--input-hover-bg-color`, `--popup-secondary-bg-color`) to `--ivory`, `--parchment`, and `--warm-sand`, and the text/border/shadow/font variables to `--near-black`, `--olive`, `--border`, `--stone`, the whisper shadow, and the app's interface font. Verify in the browser check that islands are warm (no `#ffffff`) and the chrome font is the app's.

## 2. Documentation

- [x] 2.1 Add a `DESIGN.md` rule recording that the board editor's chrome renders in the app palette, and that the scope is the palette (not layout, icons, canvas, or drawing fonts).

## 3. Verification

- [x] 3.1 Browser check: open a board on a fresh `npm run dev:test` server and inspect the computed accent, island background, shadow, and interface font on the real editor; confirm the canvas and toolbar layout are unchanged; run `npm run kill:dev` afterward.
- [x] 3.2 Run `npx oxlint --fix`, `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`, `npm run build`, and the full test suite; verify all pass.
