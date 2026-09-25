## 1. Sidebar loses the control row

- [x] 1.1 In `src/components/Sidebar.tsx`, remove the `.controls` band (Back, Forward, Today), the now-unused `ChevronIcon` helper, the `canBack`/`canForward`/`onBack`/`onForward`/`onToday` props, and the local `todayTick` state; accept a `todayTick` prop instead and forward it to `JournalCalendar`. Remove the `.controls`/`.control`/`.controlLabel`/`.controlIcon` rules from `Sidebar.module.css`. Verify `Sidebar.test.tsx` and `App.test.tsx` compile and the sidebar's first band is the Journal section.

## 2. Status bar gains the navigation controls

- [x] 2.1 In `src/components/StatusBar.tsx`, accept `canBack`, `canForward`, `onBack`, `onForward`, `canToday`, and `onToday`, and render Back, Forward, and Today at the leading edge in that order, before the pin. Move the chevron helper into this file; keep Back/Forward's `aria-label`s, their disabled rule, and Today's disabled rule. Verify with a `StatusBar.test.tsx` case asserting the controls render, in order, and disable correctly.
- [x] 2.2 In `src/components/StatusBar.module.css`, replace the rail-width `.lead` cell and its right border with a content-sized navigation group followed by the pin; keep the breadcrumb, status group, vault group, and version in their existing order. Verify the bar's DOM order is nav, pin, breadcrumb, then the trailing groups.

## 3. App wiring

- [x] 3.1 In `src/App.tsx`, move `canBack`, `canForward`, `onBack`, `onForward`, and the Today enable/`onToday` props from `Sidebar` to `StatusBar`; add `todayTick` state, bump it inside `handleToday`, and pass it to `Sidebar` so `JournalCalendar` still re-anchors. Verify `npm run build` and that Today from the status bar re-anchors a browsed-away calendar.

## 4. Tests

- [x] 4.1 Update `src/components/StatusBar.test.tsx` for the three controls, their order, and their disabled states. Verify the test file passes.
- [x] 4.2 Update `src/components/Sidebar.test.tsx` and `src/App.test.tsx` (the sidebar-scoped `nav()` helper and the Back/Forward/Today cases) to query the status bar. Verify the test files pass.
- [x] 4.3 Run the full check: `npx oxlint --deny-warnings --format=agent`, `npm run fmt`, and `npm test`. Verify all pass.

## 5. Wrap-up

- [x] 5.1 Bump `version` in `package.json` (patch) and confirm the status-bar version badge shows the new value. Verify the build and the badge.
