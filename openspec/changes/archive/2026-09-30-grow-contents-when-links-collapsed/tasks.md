## 1. Layout

- [x] 1.1 Add a `:has()` rule to `MetaPanel.module.css` so that, while the Links `<details>` is closed and Contents is open, Contents grows to fill (`display: flex`, `flex: 1 1 auto`), its body drops the 40vh cap (`flex: 1 1 auto; max-height: none`), the `.links` group stops growing, and the footer's auto margin is zeroed; verify the CSS is present and lint/format pass.
- [x] 1.2 Verify the `::details-content` wrapper carries the flex chain for `.contents` so the body fills the section, matching the existing `.section` rules.

## 2. Verify

- [x] 2.1 Start the app (`npm run dev:test`), open a vault, confirm that collapsing Links makes Contents fill the panel above the collapsed row and scroll within itself, and that opening Links restores the content-sized Contents; sweep the server with `npm run kill:dev`.
- [x] 2.2 Run `npm run test` and `npm run build`; both pass (structure/state tests are unchanged; no jsdom layout assertions added).

## 3. Finish

- [x] 3.1 Run `npx oxlint --fix`, then `npm run fmt`, and confirm clean with `npx oxlint --deny-warnings --format=agent`.
- [x] 3.2 Bump `version` in `package.json` as part of the commit (MINOR).
