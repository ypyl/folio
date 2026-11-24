# Proposal

## Why

Diagrams are complete and have been behind a build flag since they landed: the
fence renderer in the editor, the deck's own pass, the app's palette, the
viewport-scoped rendering, the serialized engine, the loading placeholder, and
the failure note that keeps the source. The e2e suite has exercised all of it
since, but in a shipped build someone has to find the rail's flask and flip it
before a `mermaid` fence draws anything.

The flag also misstates the feature's cost. A vault with no diagram fetches
nothing, starting the app fetches nothing, and the engine stays out of the
offline install: the capability pays only when a diagram is on screen. That is
the property that made it acceptable to ship behind a flag (ADR-0037), and it is
the property that makes it safe to ship on.

The gate has also drifted from what it implies. `features.diagrams || prerelease`
means the experimental switch, whose popup says it turns on agent tools, also
silently changes how pages render. After this change the switch means the one
capability still gated.

## What Changes

- **Diagrams ship in every build.** The `VITE_DIAGRAMS` flag, its description in
  `experimentalFeatures`, and the `flag || switch` gate in `App` go, and the
  editor pane and the presentation deck mount their drawing runtime without
  being handed a gate. The engine, the palette, the viewport scoping, the
  placeholder, the failure note, and the serialization stay exactly as they are.
- **The e2e runs the build a user runs.** `playwright.config.ts` drops
  `VITE_DIAGRAMS`, and `diagrams.spec.ts` asserts the drawing with no switch to
  flip.
- **A slide's diagram now draws.** The deck replaces a slide's fence with a
  placeholder before the drawing lands, and its runtime is released and rebuilt
  when React re-runs the mount effect (StrictMode does this on every mount), so
  the second runtime found no fence and the block waited forever. Releasing a
  runtime now puts back the fences it replaced but never drew, which is what the
  presentations spec already required.
- **Prerelease mode stays.** The agent's tools are still gated, so the rail's
  switch, its preference, and its spec remain; its popup now names one capability
  instead of two.
- **The docs say the feature is here.** `README.md` gains the capability and a
  short section on what a fence draws; ADR-0037's "shipped behind a flag" clause
  records the release instead.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `diagrams`: a new requirement states that the capability renders in every
  build, with no build-time flag and no app-level switch gating it. The existing
  requirements are unchanged: the fence, the source at the caret, the palette,
  the lazy engine, the placeholder, and the failure note already describe the
  shipped behaviour.

## Non-goals

- No change to what draws: the fence grammar, the palette, the placeholder, the
  failure note, the viewport scoping, and the cache stay as they are.
- No new diagram type, no export, no image copy, and no editing a diagram as a
  picture: that is a whiteboard, and ADR-0037 keeps the two apart.
- No change to the board editor's mermaid conversion, which shares the engine.
- No change to the agent's gate, the experimental switch, or the prerelease
  preference.
- No re-drawing on access: the engine is still fetched the first time a diagram
  is drawn, never at startup.

## Impact

- `src/features.ts`: the `diagrams` flag and its `experimentalFeatures` entry go;
  the module comments now describe one gated capability.
- `src/features.test.ts`: the two diagrams flag cases go.
- `src/App.tsx`: `diagramsEnabled` goes, and the pane and the deck are no longer
  handed a gate.
- `src/components/EditorPane.tsx`, `src/components/PresentationView.tsx`: the
  `diagrams` prop and its conditionals go; the runtime is mounted with the pane
  and with the deck.
- `src/App.integration.test.tsx`: the three gate cases become one, asserting the
  runtime is supplied with no switch.
- `src/components/PresentationView.test.tsx`: the "no prop, no drawing" case goes
  with the prop.
- `playwright.config.ts`: `VITE_DIAGRAMS` drops out of the web server's
  environment.
- `README.md`, `adr/0037-a-diagram-is-a-render-of-a-fence.md`: the release note
  and the decision.
- Version bump: a minor bump for the feature commit, a patch for the archive
  commit.
