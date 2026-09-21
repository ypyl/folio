## 1. Remove it from the panel

- [x] 1.1 Revert `src/components/MetaPanel.tsx`, `MetaPanel.module.css`, and `MetaPanel.test.tsx` to their pre-`move-version-to-panel` state (the sticky shortcuts details with no badge, and the tests that assert it).
- [x] 1.2 `AGENTS.md`: point the build-identity line at the status bar.

## 2. Add it to the status bar

- [x] 2.1 `src/components/StatusBar.tsx`: import the version and render `v<version>` as a trailing flex item after the vault group, beside the file count and always present.
- [x] 2.2 `src/components/StatusBar.module.css`: a stone, non-wrapping `.version` rule; the bar's own `gap` spaces it from the vault group.
- [x] 2.3 `src/components/StatusBar.test.tsx`: assert the bar shows `v<version>` (matching `package.json`) alongside a vault's name and count, and that it renders with no vault; confirm the vault group stays empty without a vault.

## 3. Verification

- [x] 3.1 Browser check on a fresh `npm run dev:test` server: in the empty, page-open, and board states the status bar shows `v<version>` at its trailing edge beside the vault's name and count, and the meta panel shows no badge; run `npm run kill:dev` afterward.
- [x] 3.2 Run `npx oxlint --fix`, `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`, `npm run build`, and the full suite; verify all pass.
