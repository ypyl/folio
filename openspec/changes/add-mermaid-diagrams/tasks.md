# Tasks

## 1. Spike, dependency, and the build shape

- [x] 1.1 Add `mermaid` to `package.json` as a direct dependency at the version
  already installed, and verify with `npm ls mermaid` that the tree resolves to
  one copy rather than a second one beside the board's.
- [x] 1.2 Give the engine its own chunk: a `mermaid` group in `vite.config.ts`'s
  `codeSplitting.groups` at a priority above the `excalidraw` group, matching the
  diagram packages, with recursive capture off and the shared libraries left in
  `vendor`, plus the group's files in `globIgnores`. Verify with `npm run build`
  that the build succeeds, `index.html` preloads no diagram chunk, and the
  `excalidraw` group no longer holds mermaid.
- [x] 1.3 Run the cost spike against a throwaway page of 20 diagrams (one
  flowchart, one sequence diagram, one gantt, the rest small): record one
  `mermaid.render()` duration per kind, the count of renders when the page opens,
  and keystroke-to-paint with a diagram in view against the same page without
  diagrams. Fill the table in `design.md`'s "Cost and its measurement" and delete
  the throwaway page.
- [x] 1.4 Write ADR-0037 (`adr/0037-a-diagram-is-a-render-of-a-fence.md`): a
  diagram is a derived render of a fenced block, never a file, with ADR-0024's
  board and ADR-0029's surface as the neighbouring decisions; add its row to
  `adr/README.md`.

## 2. The diagram module

- [x] 2.1 `src/editor/diagrams.ts`: the readable-fence rule (info string
  `mermaid`, case- and space-insensitive, with a non-empty body) and the source
  text a render is keyed by. Verify with unit tests for the accepted forms, another
  language, an indented block, and an empty body.
- [x] 2.2 The engine seam: one function that imports mermaid lazily, applies the
  app's configuration before every render, and renders with `securityLevel:
  'strict'`. Verify with a unit test over an injected fake engine that the
  configuration is set on each call and that the import happens once.
- [x] 2.3 The queue and the cache: one render at a time, keyed by source text, a
  failed source remembered so it is not retried, and an entry released when its
  last live element goes away. Verify with unit tests driving the fake engine
  through success, failure, a repeat register, and a release.

## 3. The editor's diagram field

- [x] 3.1 The state field and the block widget in `codemirror.ts`, recomputing
  only the fences an edit touched and comparing the widget by source text. Verify
  with integration tests that a `mermaid` fence renders while the selection is
  outside it, another language does not, and an edit elsewhere leaves the drawn
  diagram in place.
- [x] 3.2 The reveal rule: the selection touching the fence shows its source, a
  press on the diagram places the caret in the fence, and leaving it draws again.
  Verify with integration tests for each of the three.
- [x] 3.3 Viewport scoping: register each diagram's element with the pane's
  observer seam, draw only what is in view, and release on exit. Verify with unit
  tests over the injected observer, and with an integration test that a diagram
  below the first screen is not requested until scrolled to.
- [x] 3.4 The block's styling in `src/editor/diagramView.module.css` from
  DESIGN.md's tokens (fits the pane's width, never scrolls sideways, the note's
  place), one line in `DESIGN.md`'s list of the pane's rendered constructs, and
  the failure note rendered presentational and non-blocking. Verify with a
  component test for the failed case and a visual check in the running app.

## 4. The deck

- [x] 4.1 A diagram pass over the slide host in `PresentationView.tsx`, beside
  the image pass, finding a slide's `pre > code.language-mermaid` and swapping in
  the drawn diagram. Verify with an integration test that a slide's mermaid fence
  shows a diagram and the page's Markdown keeps the fence.
- [x] 4.2 The failing case in the deck: an unmappable fence stays its source
  rather than an empty box. Verify with an integration test.

## 5. The gate

- [x] 5.1 `features.diagrams` (`VITE_DIAGRAMS === '1'`, off by default) with its
  `experimentalFeatures` entry, the effective gate computed once in `App` and
  passed to the pane and to the presentation. Verify with `features.test.ts`'s
  set-equality test and with tests that the gate-off app renders no diagram, runs
  no engine import, and leaves the fence as source.

## 6. Integration and release shape

- [x] 6.1 e2e: a mermaid fence typed into a page renders as a diagram with the
  flag set, and the page's Markdown is unchanged after a save. Verify with
  `npm run test:e2e`.
- [x] 6.2 Run the whole gate: `npm test`, `npx tsc -b`, `npx oxlint
  --deny-warnings --format=agent`, `npm run build`, and `npm run test:e2e`.
- [x] 6.3 Bump `version` in `package.json` (minor) and run `npm run changelog`.

## Workflow follow-up

- Archive the change after the gates pass, syncing the main specs and moving the
  change directory, with the archive commit's own patch bump.
- Push `master` to `origin` and `nas`, then publish the GitHub Release
  `v<feature version>` at the feature commit, drawn from `CHANGELOG.md`.
