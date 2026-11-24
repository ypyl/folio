# Tasks

## 1. The gate goes

- [x] 1.1 In `src/features.ts`, delete the `diagrams` flag and its `experimentalFeatures` entry, and reword the module's comments for the one capability still gated; `src/features.test.ts` keeps the flag read and coverage cases for the agent and drops the two diagrams cases.
- [x] 1.2 In `src/App.tsx`, delete `diagramsEnabled` and stop handing the pane and the deck a gate; no surface reads a flag or the preference before drawing.
- [x] 1.3 In `src/components/EditorPane.tsx` and `src/components/PresentationView.tsx`, delete the `diagrams`/`showDiagrams` prop and its conditional so the runtime mounts with the surface.
- [x] 1.4 In `src/editor/diagrams.ts`, make `release` put back a fence the deck pass replaced but never drew, and cover it in `src/editor/diagrams.test.ts` (the fence returns, and a second runtime draws it).
- [x] 1.5 In `src/App.integration.test.tsx`, replace the three gate cases with one asserting the runtime is supplied with no switch; in `src/components/PresentationView.test.tsx`, delete the "no prop, no drawing" case.

## 2. The run and the docs say the capability is here

- [x] 2.1 Drop `VITE_DIAGRAMS` from `playwright.config.ts` (and the `env` block it leaves empty) and reword `tests/e2e/diagrams.spec.ts`'s header; add the presentation case to that suite (a slide draws its diagram with no switch), and run it with no switch.
- [x] 2.2 Add the capability to `README.md`: a Features bullet and a short section on what a fence draws, that the Markdown stays the page, and that the engine loads only when a diagram is shown.
- [x] 2.3 Update `adr/0037-a-diagram-is-a-render-of-a-fence.md`: the "shipped behind a flag" clause becomes the release decision.

## 3. Version

- [x] 3.1 Bump `version` in `package.json` (minor: a capability that shipped off is now on) and regenerate `CHANGELOG.md` with `npm run changelog`.

## 4. Integration verification

- [x] 4.1 Run the unit and integration suites, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`, and `npm run build`; verify all green.
- [x] 4.2 Run the whole e2e suite with no feature environment variable; verify all green and sweep dev servers with `npm run kill:dev`.

## Workflow follow-up

- Archive the change with `/opsx-archive`, syncing the main `diagrams` spec (the added requirement) and moving the change directory.
- Publish the GitHub Release for the feature commit's version, with notes drawn from `CHANGELOG.md`.
