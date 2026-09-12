## 1. Version source

- [x] 1.1 Add `"resolveJsonModule": true` to `tsconfig.app.json`; verify `npx tsc -b` accepts a JSON import under `src`.
- [x] 1.2 Create `src/version.ts` exporting `APP_VERSION` from `package.json`'s `version` (named import, so only that field is bundled); verify `npm run build` succeeds and the bundled value matches `package.json`.

## 2. Header badge

- [x] 2.1 In `Header.tsx`, render `v{APP_VERSION}` as a `<span>` beside the brand button (a sibling, not inside it), present in every state; verify the brand button's accessible name stays "Folio, go home" and the span is not a control.
- [x] 2.2 Style the badge in `Header.module.css` with the row's existing treatment (`--stone`, small text, no hover/focus state); verify no new color value is introduced and every declaration references a token in `DESIGN.md`.

## 3. Tests

- [x] 3.1 Extend `Header.test.tsx`: the badge renders `v<version>` matching `package.json`, both with and without `search`/`onHome` props; verify `npx vitest run src/components/Header.test.tsx` passes.
- [x] 3.2 Verify `App.test.tsx` still passes with the badge present (the header renders in every app state).

## 4. Verification

- [x] 4.1 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, and `npm run build`; verify all are clean.
- [x] 4.2 Bump `version` in `package.json` for this commit (minor: a new user-facing capability) per the `AGENTS.md` rule, and verify the badge shows the bumped value.
- [x] 4.3 Smoke-test in a browser: the badge reads the current version in the empty state, while indexing, and with a vault open, and clicking it behaves as the brand does (or does nothing if it is a plain span).
