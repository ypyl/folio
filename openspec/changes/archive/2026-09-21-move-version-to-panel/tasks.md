## 1. Remove it from the header

- [x] 1.1 `src/components/Header.tsx`: drop the version `import` and the `<span className={styles.version}>`, keeping the brand button and its comment accurate.
- [x] 1.2 `src/components/Header.module.css`: drop the `.version` rule (and the baseline-difference comment that explains only it); leave `.brand` as the row for the brand button.
- [x] 1.3 `src/components/Header.test.tsx`: remove the two version tests.

## 2. Add it to the panel

- [x] 2.1 `src/components/MetaPanel.tsx`: import the version and render `v<version>` as a right-aligned line in the panel's bottom-anchored group, after the keyboard-shortcuts reference.
- [x] 2.2 `src/components/MetaPanel.module.css`: wrap the shortcuts details and the badge in a bottom-anchored group (`margin-top: auto`, `position: sticky`, `bottom: 0`, ivory fill); move those off the details; add the badge's right-aligned, stone, 12px rule.
- [x] 2.3 `src/components/MetaPanel.test.tsx`: assert the panel shows `v<version>` (matching `package.json`) as a non-interactive element, in every state.

## 3. Documentation

- [x] 3.1 `AGENTS.md`: the build-identity line names "the header badge"; point it at the meta panel's badge.

## 4. Verification

- [x] 4.1 Browser check on a fresh `npm run dev:test` server: the header shows no version; the meta panel shows `v<version>` at its bottom-right corner, above the status bar, in the empty state, with a page open, and with a board open; run `npm run kill:dev` afterward.
- [x] 4.2 Run `npx oxlint --fix`, `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`, `npm run build`, and the full suite; verify all pass.
