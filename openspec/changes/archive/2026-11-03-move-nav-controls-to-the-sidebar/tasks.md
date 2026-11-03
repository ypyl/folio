# Tasks

## 1. Move the controls into the sidebar

- [x] 1.1 `src/components/Sidebar.tsx`: accept `canBack`, `canForward`, `onBack`,
      `onForward`, `canToday`, `onToday` (with doc comments naming the owning
      capability), keeping the memo's stability comment honest.
- [x] 1.2 Render the navigation row as a fixed band between the Journal and Files
      accordions, holding Back (chevron), Forward (chevron), Today (labelled), in
      that order, with the same disabled rules and accessible names, and the
      chevron glyph moved over from `StatusBar`.
- [x] 1.3 `src/components/Sidebar.module.css`: styles for the row and its three
      controls, plus the 44 by 44 target at the shell's compact breakpoint.
- [x] 1.4 `src/components/StatusBar.tsx` and `StatusBar.module.css`: remove the
      `.nav` group, `ChevronIcon`, `.control`/`.controlLabel`/`.controlIcon` and
      their compact sizing; drop the six nav props.
- [x] 1.5 `src/App.tsx`: pass the nav props and `todayTick` to `Sidebar` instead of
      `StatusBar`.

## 2. Follow the move through the docs and copy

- [x] 2.1 `src/tour/steps.ts`: the sidebar step names Back, Forward, and Today;
      the status step describes only what the bar still holds.
- [x] 2.2 `DESIGN.md`: the touch-target rule and the compact app-bar paragraph.
- [x] 2.3 `adr/0005-keep-ui-small-three-pane-layout.md`: amend the compact
      composition's sentence naming the bar as the holder of the three controls.

## 3. Tests

- [x] 3.1 `src/components/StatusBar.test.tsx`: drop the navigation cases, keep the
      status group's; assert the bar renders no Back, Forward, or Today control.
- [x] 3.2 `src/components/Sidebar.integration.test.tsx`: inversion of the old
      "holds no navigation controls" case into the row's cases — order, disabled
      rules, and the Today tick still re-anchoring the calendar.
- [x] 3.3 `src/App.integration.test.tsx`: the trail, Today, and compact cases still
      resolve through their accessible names; add the assertion that the status
      bar no longer holds them.
- [x] 3.4 `tests/e2e/compact-shell.spec.ts`: the app bar's control inventory
      shrinks to the two view controls plus the open item; the navigation row's
      controls meet 44 by 44 inside the navigation view.

## 4. Verify

- [x] 4.1 `npm run test:unit` and `npm run test:integration`.
- [x] 4.2 `npx tsc -b`, `npm run build`.
- [x] 4.3 `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings
      --format=agent`.
- [x] 4.4 `npm run test:e2e` with the servers started by `npm run dev:test` and
      swept with `npm run kill:dev`.
- [x] 4.5 Bump `version` in `package.json` (minor: a user-visible capability
      moves).
