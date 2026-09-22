## 1. Trim the pane padding

- [x] 1.1 Change `.sidebar`'s padding to `4px` in `src/components/Sidebar.module.css` and update the comment to say why the right padding is no longer 16px (the reserved lane already separates the content). Verify: the declaration reads `padding: 4px`.
- [x] 1.2 Change `.panel`'s padding to `4px` in `src/components/MetaPanel.module.css`, same comment update. Verify: the declaration reads `padding: 4px`.

## 2. Verification

- [x] 2.1 Run `npx oxlint --fix`, `npm run fmt`, `npm run test`, and `npm run build`; resolve anything they report. Verify: all four exit clean.
- [x] 2.2 Browser-check in Chromium: start with `npm run dev:test`, confirm the log says `ready in`, and measure the pane's content insets. Verify: the left inset is 4px and the right inset is padding + the reserved lane (16px + 4px = 20px), with the row text no longer 32px from the border; then `npm run kill:dev`.
- [x] 2.3 Run `npx oxlint --deny-warnings --format=agent` and confirm zero warnings before finishing.
