# Tasks

- [x] 1.1 `MetaPanel.tsx`: build the two controls and pass them as the Contents
      accordion's `actions`, gated on page open, not loading, and a non-empty
      tree; drop `onExpandAll` / `onCollapseAll` (and the sticky tool row) from
      `ContentList`.
- [x] 1.2 `MetaPanel.module.css`: the two controls' summary-row treatment;
      remove `.contentTools` / `.contentTool` and their sticky background.
- [x] 1.3 `MetaPanel.test.tsx`: the controls sit on the Contents summary, are
      reachable with the section collapsed, and activating one does not toggle
      the section; the no-heading case still offers neither.
- [x] 2.1 `npm test`, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`,
      `npm run build`, `npm run test:e2e`.
- [x] 2.2 Bump `version` in `package.json` (patch).
