## 1. Sidebar control row

- [x] 1.1 Add `onToday` to `Sidebar` (optional) and render a labelled `Today` button after the Forward control inside the existing `styles.controls` row, disabled when `!hasVault`; verify `npx vitest run src/components/Sidebar.test.tsx` passes with a row that holds three named controls in order.
- [x] 1.2 Style the control in `Sidebar.module.css` with the row's existing treatment (stone at rest, brand on hover/focus, the shared focus ring, dimmed and non-activating when disabled) and a label-sized box instead of the icons' fixed square; verify the rule introduces no new color value — every declaration references a token already in `DESIGN.md`.
- [x] 1.3 Extend the prop-stability inventory comment above `memo(Sidebar)` with the new prop (`onToday`, a stable callback); verify the comment names every prop the component reads.

## 2. App wiring

- [x] 2.1 In `App.tsx`, add a `useCallback` `handleToday` that opens `journals/${localDayString(new Date())}.md` through `handleSelect` and pass it to `Sidebar` as `onToday` (the calendar's anchor tick stays in the Sidebar — see design D3); verify `npx vitest run src/App.test.tsx` passes, including the case where activating Today opens the current day's journal and creates no file.
- [x] 2.2 Confirm the activation is recorded like any other navigation and leaves the vault untouched: verify a test (or the existing trail assertion) shows the today path as the trail's last entry and the fake vault's file count unchanged after activating Today.

## 3. Journal calendar

- [x] 3.1 Remove the Today button, its handler, and its styles from `JournalCalendar.tsx` / `JournalCalendar.module.css`, and let the remaining header span the section with the chevrons at the ends and the month centered (design D6); verify the rendered calendar is 42 day cells plus the two month chevrons and nothing else, and that the chevrons sit flush to the section's two edges with the label centered between them.
- [x] 3.2 Accept `todayTick` and add it to the re-anchor effect's dependencies, leaving the effect body unchanged; verify a test where the calendar is browsed to another month with today's journal already the open day and activating Today re-anchors the grid to today's month (the real control, so the case lives in `Sidebar.test.tsx`).

## 4. Tests

- [x] 4.1 Update `JournalCalendar.test.tsx`: the grid test's button count (45 -> 44), the chevrons-browse case's Today assertion, and the removal of its Today navigation case; verify `npx vitest run src/components/JournalCalendar.test.tsx` passes.
- [x] 4.2 Update `Sidebar.test.tsx`: the control row holds Back, Forward, and Today in that order, each with an accessible name; Back/Forward stay disabled without anywhere to step, and Today is disabled while `hasVault` is false; verify `npx vitest run src/components/Sidebar.test.tsx` passes.
- [x] 4.3 Update `App.test.tsx`: "no Today before a folder opens" becomes "Today is rendered and disabled"; verify the whole suite (`npm test`) passes.

## 5. Verification

- [x] 5.1 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent`; verify all three are clean.
- [x] 5.2 Smoke-test in a browser against a real vault: Today is reachable with the Journal section collapsed, opens today's journal, re-anchors the calendar after chevron browsing, is dimmed with no folder open, and Back/Forward and the windowed listing behave as before.
