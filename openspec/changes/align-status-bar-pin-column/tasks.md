## 1. Status bar layout

- [ ] 1.1 In `src/components/StatusBar.module.css`, set `.bar` to `padding: 4px 16px 4px 0`, `.pin` to `width: var(--rail-w)`, and `.divider` to `margin-left: -10px`, each with a short comment naming the column rule (design D1/D3); verify every declaration references an existing token or value and no new color is introduced.
- [ ] 1.2 Verify the rendered geometry matches the spec: in a browser, the bar's leading cell measures 56px and the hairline's left edge is at x=56, the same x as the rail's right border, with the breadcrumb following it.

## 2. Gates

- [ ] 2.1 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent`; verify all three are clean.
- [ ] 2.2 Run `npm test` and `npm run build`; verify both pass with no new warnings — the change is CSS-only, so no test asserts layout and none should need updating.
- [ ] 2.3 Dev smoke: `npm run dev`, open a page in `sample/`, and check the pin's enabled and disabled states, the hover and `:focus-visible` treatments on the wider control, and that the path, status, and vault groups keep their order and spacing.
