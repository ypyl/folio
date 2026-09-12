## 1. Status bar layout

- [x] 1.1 In `src/components/StatusBar.module.css`, set `.bar` to `padding: 4px 16px 4px 0` and `.pin` to `width: var(--rail-w)`, each with a short comment naming the column rule (design D1/D4); verify every declaration references an existing token or value and no new color is introduced.
- [x] 1.2 Verify the rendered geometry matches the spec: in a browser at desktop width, the pin's cell measures 56px and starts at the bar's leading edge, in the same x range as the `<nav>` rail's column, with the breadcrumb following it and the hairline, status group, and vault group in their existing order and spacing.

## 2. Gates

- [x] 2.1 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent`; verify all three are clean.
- [x] 2.2 Run `npm test` and `npm run build`; verify both pass with no new warnings — the change is CSS-only, so no test asserts layout and none should need updating.
- [x] 2.3 Dev smoke: `npm run dev`, open a page in `sample/`, and check the pin's enabled and disabled states, the hover and `:focus-visible` treatments on the wider control, and that the path, status, and vault groups keep their order and spacing.
