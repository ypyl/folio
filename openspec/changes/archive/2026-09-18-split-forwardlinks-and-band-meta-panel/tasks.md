## 1. Row split (App and MetaPanel)

- [x] 1.1 `MetaPanel`: add a `references: LinkRow[]` prop, render the References section (collapsed by default, between Forwardlinks and the keyboard-shortcuts footer) with its own empty-state copy, drop `kind` from `LinkRow`, and give `LinkList` the section's activation handler plus a dim flag instead of a per-row branch. Verify by updating `src/components/MetaPanel.test.tsx` so its asset cases pass `references` and running `npx vitest run src/components/MetaPanel.test.tsx`.
- [x] 1.2 `App`: split the single `forwardlinkRows` memo into page rows and `referenceRows` (the `pageAssets(page, graph)` rows labelled with `assetName`), keeping both on the `[graph, page]` dependencies, and pass `references` to `MetaPanel`. Update `src/App.test.tsx` (the "forwardlinks list the open page's files" case and the backlinks/forwardlinks case) so each assertion is scoped to the section it means, then verify with `npx vitest run src/App.test.tsx`.

## 2. Banded panel layout

- [x] 2.1 Add the panel's band rules to `src/components/MetaPanel.module.css` (open section shares leftover height with a 120px floor, own scroll body, one-row collapsed section, panel scroll only as a fallback), reusing `Accordion`'s existing `className`/`bodyClassName`. Verify in the browser that with all four sections open the panel shows no scrollbar and only the long listing scrolls.
- [x] 2.2 Confirm the keyboard-shortcuts footer still behaves: summary on the panel's bottom edge in every open/closed combination, opening it grows upward with no internal scroll region or height cap.
- [x] 2.3 Record the band rule in `DESIGN.md` (a pane may be a column of bands; one listing scrolls inside its own body) so both panes share the documented rule.

## 3. Verification

- [x] 3.1 Extend `src/components/MetaPanel.test.tsx` to cover: a page's asset rows appear only in References (scoped by section, since jsdom does not apply the collapsed section's `display: none`), References is collapsed by default, an asset row is never dimmed and activates `onOpenAsset`, and each section shows its own empty copy. Verify with `npx vitest run src/components/MetaPanel.test.tsx`.
- [x] 3.2 Measure in Chromium at 1280×720 (start with `npm run dev:test`, wait for `ready in`, drive with `playwright-cli`, then `npm run kill:dev`): section heights with References open, panel `scrollHeight` vs `clientHeight`, collapsed section height, body scroll extent, footer position, and the ~420px-tall fallback. Record the numbers in `PLAN.md`.
- [x] 3.3 Confirm the typing budget is untouched: `npx vitest run` passes unchanged, including the memoized-sidebar test, and no new measurement or per-keystroke work was added.

## 4. Docs, identity, and lint

- [x] 4.1 Bump `package.json` to 0.11.0 and add the change's numbered task entry to `PLAN.md` with the measured numbers from 3.2.
- [x] 4.2 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npm test`, and `npm run build`; all clean.
