# Design

## Context

See proposal.md - Why. The pieces that shape the approach:

- `features.diagrams` (from `VITE_DIAGRAMS`) is read once, in App's
  `diagramsEnabled = features.diagrams || prerelease`, and the value is handed
  to two surfaces: `EditorPane`'s `showDiagrams` prop and `PresentationView`'s
  `diagrams` prop. Each surface creates the drawing runtime only while the value
  is true, and each passes nothing to the editor/deck when it is false.
- The runtime is lazy in the right way already: `createDiagrams` wires a
  viewport observer and fetches the engine only when a fence is drawn, so
  mounting it costs a listener, not a download. `codemirror`'s `setDiagrams` and
  the deck's own pass do nothing when no mermaid fence is present.
- `experimentalFeatures` and `features` are kept equal by `features.test.ts`, and
  the rail's popup renders from `experimentalFeatures`, so removing one entry
  removes the popup row with it.
- The agent's tools stay gated (`features.agentTools || prerelease`), so
  prerelease mode, its preference, its rail control, and its spec all stay.

## Goals / Non-Goals

**Goals:**

- Promote the capability with no behavioural change at all: the same drawing, the
  same laziness, the same palette, the same failure note.
- Leave no gate, no flag, and no prop that can only ever be on.
- Keep the keystroke path untouched: mounting the runtime is what the pane
  already did when the gate was on.

**Non-Goals:**

- No change to the fence grammar, the engine's configuration, or the deck's pass.
- No retirement of prerelease mode: another capability is still gated.
- No new tests of the drawing itself; its coverage stands, minus the gate cases.

## Decisions

### D1: Delete the gate rather than pass a constant

`diagramsEnabled` goes, and with it the `diagrams`/`showDiagrams` prop on both
surfaces: the pane creates its runtime on mount and the deck creates its own,
exactly as they did while the switch was on. `features.diagrams` and its
`experimentalFeatures` entry go too, so the popup's coverage test cannot describe
a capability nothing gates.

Alternative rejected: keep the prop and pass `true` from App. It leaves a branch
that can only ever take one path, and a dead gate is exactly what made the
flag-off behaviour easy to misread while it was here.

### D2: The era of two gates is over, not the mechanism

Prerelease mode stays: the agent's tool surface is still experimental, still
ships off, and still needs a way to be tried without a rebuild. The change is
narrow on purpose. `src/prerelease.ts`, the rail control, and the `prerelease`
spec are untouched, and the popup renders one row instead of two because it
renders whatever `experimentalFeatures` holds.

Alternative rejected: retire prerelease mode with this release, as the session
trace did. That would un-gate the agent's write surface, which is a product
decision this change is not making.

### D3: The runtime mounts with the surface, not when a diagram appears

The pane builds its diagram runtime on mount even for a page with no fence. That
is what it already did whenever the switch was on: `createDiagrams` installs an
observer and starts nothing else, and the engine is fetched by the first drawing
request. Mounting earlier changes no network, no file, and no keystroke.

Alternative rejected: create the runtime lazily on the first `mermaid` fence. It
would add a parse per render to decide, and the editor would have to be told
about the change after it mounted, which is more machinery for no measurable
saving.

### D4: The e2e drops the flag and keeps the suite

`playwright.config.ts` no longer sets `VITE_DIAGRAMS`, so the web server's `env`
block goes, and `diagrams.spec.ts` becomes an assertion about the shipped app
rather than about a build the run turned on. Nothing else in the suite changes:
`agent.spec.ts` still finds the switch and its popup, now naming one capability.

### D5: Releasing a runtime puts back the fences it replaced

The deck's pass replaces a slide's `<pre><code class="language-mermaid">` with
its placeholder figure before any drawing exists. The runtime that made the
replacement is the only thing holding the fence's source, so a second runtime
handed the same host finds nothing to sync and the placeholder waits forever.
React re-runs a mount effect on every mount (StrictMode does it in the dev
build), and the promotion's new e2e case is the first to present a diagram, so
the deck's slide path was the one place this showed.

`release` now restores a fence it replaced and never drew, so a surface that
stays on screen is the DOM a fresh runtime expects. A drawn fence is left as it
is: the drawing is disposed with the host, and putting the text back would undo
what the slide shows.

Alternative rejected: remember the source on the box in a `data-` attribute and
have `sync` adopt waiting boxes. It stores page text in the DOM for a runtime
that may never come, and the restore is the inverse of what `sync` already did.

## Risks / Trade-offs

- [A shipped build now parses every page for mermaid fences] → It already did
  whenever the switch was on, and the pass is scoped to the visible region and
  keyed by the fence's source (ADR-0037). The cost is the same one the
  experimental build paid.
- [Removing the popup's second row surprises a user who turned the switch on for
  diagrams] → Diagrams did not need the switch; the popup now tells the truth
  about what it turns on. The README says diagrams are on.
- [The gate's removal loses a way to ship a broken diagram build off] →
  Deliberate: the capability is settled, and a future regression is a bug to fix,
  not a reason to re-gate a working feature. Re-adding a flag is the same
  mechanism the history records.
