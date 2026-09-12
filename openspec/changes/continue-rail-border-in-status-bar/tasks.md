## 1. Status bar markup

- [ ] 1.1 In `src/components/StatusBar.tsx`, wrap the pin button in a leading cell element and drop the standalone divider element, leaving the bar's children as the cell, the path group, the status group, and the vault group, each with its existing content and comment; verify the rendered bar still renders the pin's accessible name, `aria-pressed`, title, and disabled state, and that `npx vitest run src/components/StatusBar.test.tsx` passes unchanged.

## 2. Status bar styles

- [ ] 2.1 In `src/components/StatusBar.module.css`, replace the `.divider` rule with a `.lead` rule for the leading cell — `display: flex; align-items: center; justify-content: center; width: var(--rail-w); border-right: 1px solid var(--border); flex-shrink: 0` — and remove the 56px width from `.pin` so the control keeps its own 24px box centred in the cell (design D1/D2); verify every declaration references an existing token and no new color is introduced.
- [ ] 2.2 Verify the rendered geometry matches the spec in a browser at desktop width: the leading cell's right border occupies the same x range as the `<nav>` rail's right border (55..56), the cell spans [0,56], the pin's box is 24px centred in it, and the breadcrumb starts at 66 with the status and vault groups keeping their order.

## 3. Gates

- [ ] 3.1 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent`; verify all three are clean.
- [ ] 3.2 Run `npm test` and `npm run build`; verify both pass and that no test needed changing — no test asserts the hairline.
- [ ] 3.3 Dev smoke: `npm run dev` and check the bar with no page open and with a page open — one hairline at the column edge, the rail's border reading as continuing into the bar, the pin's enabled/disabled states, its hover and `:focus-visible` treatments (the ring hugging the 24px star), and the path, status, and vault groups keeping their order.
