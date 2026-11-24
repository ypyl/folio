# Proposal

## Why

A fence is the only place a page can hold a picture that has a source. Today the
app renders tables, images, and inline formatting in place and leaves a fenced
block as highlighted source, so a `mermaid` fence reads as a wall of arrows and
node names that the user has to trace in their head. Every other Markdown
construct with a rendered form already renders at rest and shows its source at
the caret (ADR-0029); a diagram is the same kind of construct and the only one
left out.

The engine is nearly free to adopt: `mermaid` 11 already sits in the install as
a dependency of `@excalidraw/mermaid-to-excalidraw`, pulled in by the board
editor's paste-mermaid path and already grouped into the board chunk. Rendering
the same fences the app already types costs a direct dependency line and a chunk
of its own, not a new dependency tree.

## What Changes

- **A renderable `mermaid` fence renders in the editor.** While the selection is
  outside the fence it shows the diagram, and it shows its source as soon as the
  selection touches it, exactly as a table and an image do. The Markdown is never
  rewritten, no file is created, and nothing is added to the vault index.
- **A slide renders its diagrams too.** The deck derives its slides from the
  same Markdown, so a diagram on a slide shows as a diagram rather than as a
  fence. One engine, mounted twice: a block widget in the editor, a DOM pass over
  the slide host, next to the pass that already resolves a slide's images.
- **The engine is loaded only when a diagram is shown.** A vault with no diagram
  never fetches it, and starting the app never does. `mermaid` moves out of the
  board chunk into its own lazy group, so opening a diagram does not download the
  board editor, and the diagram engine stays out of the offline install like the
  board chunk already does.
- **Rendering is scoped to what is on screen and serialized.** Only diagrams in
  the pane's viewport render, one at a time, cached by the fence's source text, so
  a page's cost follows what is visible rather than how many diagrams it holds and
  a keystroke never waits on the engine.
- **A diagram that cannot be rendered is not a broken block.** The fence keeps its
  source and gains a quiet note saying it could not be rendered. It is not a
  dialog, not an error surface, and not a reason to lose the text.
- **The diagram is drawn in the app's palette.** Mermaid's stock white-and-blue
  theme is replaced by one configuration mapping the app's tokens, the way the
  board editor's chrome was mapped to them, so a diagram is not the one foreign
  surface on the page.
- **One global mermaid configuration, written by two paths.** The board editor
  pastes mermaid text and `@excalidraw/mermaid-to-excalidraw` calls
  `mermaid.initialize` and `mermaid.render` on the same singleton. Both paths set
  their configuration immediately before rendering, inside their own serialized
  queue, so neither a board nor a page can render in the other's palette.

Per AGENTS.md, a user-noticeable capability ships behind two layers. The flag and
the app-level experimental switch are both in the tree today (the `agentTools`
shape), so this change adds one flag entry rather than restoring anything.

## Capabilities

### New Capabilities

- `diagrams`: what makes a fenced block renderable, when it renders and when its
  source shows, what it draws with, what it must not write, how a failure reads,
  how the engine is loaded, and how the one global configuration is shared.

### Modified Capabilities

- `editing`: the constructs a page renders in place include a renderable diagram,
  presentational like the rest, revealed as source at the caret.
- `presentations`: a slide's renderable diagram renders as a diagram.

## Non-goals

- **No editing a diagram as a picture.** The source is the editing surface; this
  change adds no canvas, no reshape, no node drag (ADR-0009, ADR-0029).
- **No new file and no board.** A diagram writes nothing, so it produces no
  board, no page, no sidecar, and no index entry of its own. A board stays what
  `add-whiteboards` made it (ADR-0024).
- **No second diagram language.** `mermaid` only: no Graphviz, PlantUML, D2, or
  math. The fence info string decides, and any other info string keeps today's
  highlighted source.
- **No export.** No copy-as-SVG, no copy-as-PNG, no print path of its own.
- **No diagram navigation.** A rendered diagram is not zoomable, pannable, or
  full-screen; it fits the pane's width the way an image fits it.
- **No search or linking of diagram content.** A diagram's source is page
  content, so page search already finds it; the change adds nothing further.
- **No migration compatibility.** The fence form is ` ```mermaid ` and nothing
  else (ADR-0012): other tools' diagram conventions are literal text.
- **No change to how a fence is otherwise edited.** Folding, highlighting, the
  line panel, and the located-block frame stay as they are.

## Impact

- `src/editor/diagrams.ts` (new): what a renderable fence is, the render queue and
  its cache, the configuration, and the failure state.
- `src/editor/codemirror.ts`: a diagram field and block widget in the seam the
  table already uses, plus the caret rule's reveal.
- `src/editor/diagramView.module.css` (new): the block's box and its note, from
  DESIGN.md's tokens.
- `src/components/PresentationView.tsx`: the slide host's diagram pass, beside the
  image pass.
- `src/features.ts`, `src/features.test.ts`: the `diagrams` flag and its entry in
  `experimentalFeatures`.
- `src/App.tsx`: the effective gate, passed to the pane and to the presentation.
- `vite.config.ts`: a `mermaid` chunk group of its own, out of the `excalidraw`
  group, and its exclusion from the precache.
- `package.json`: `mermaid` as a direct dependency at the version already
  installed, plus a minor version bump.
- ADR: a new record, ADR-0037, stating that a diagram is a derived render of a
  fenced block and never a file, alongside ADR-0024's board and ADR-0029's
  surface. ADR-0001, 0009, 0012, and 0029 are unchanged.
- `DESIGN.md`: one line where the pane's rendered constructs are listed.
- Tests: the renderable rule, the reveal rule, the queue and its cache, the
  failure note, the deck's pass, the flag-off absence, and the chunk boundary.
