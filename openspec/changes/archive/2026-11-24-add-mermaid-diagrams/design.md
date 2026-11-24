# Design

## Context

See `proposal.md` for why. The constraints this design works inside:

- The page surface is the Markdown text with view-only decorations (ADR-0029).
  There is no document model to attach a rendered node to.
- A construct that replaces its own line breaks must come from a **state field**,
  not a view plugin. The GFM table already does exactly this (`tableField`,
  `TableWidget`, `block = true`, `eq()` on the source, reveal when the selection
  touches it), and is the closest working precedent.
- Two heavy renderers already live behind a lazy import with a chunk of their own
  (ADR-0024, `keep-board-chunk-lazy`), and the pane already has a viewport-scoped
  DOM pass with a bounded read queue (`assetImages`).
- The typing budget in AGENTS.md is the hard constraint: a keystroke may make one
  pass over in-memory data, and may not re-render in proportion to document or
  vault size.
- `mermaid` 11.17.2 is already installed (a dependency of
  `@excalidraw/mermaid-to-excalidraw`), and is currently captured by the
  `excalidraw` chunk group in `vite.config.ts`. Measured from the installed copy:
  all diagram types minified are 3.41 MB raw / 961 KB gzip, and the core entry
  that pulls diagram types on demand is 30 KB raw / 11 KB gzip.

## Goals / Non-Goals

Goals:

- One diagram engine, two mounts: a block widget in the editor, a DOM pass over a
  slide's host in the presentation.
- Rendering cost proportional to what is visible, never to the document.
- A failure that costs the user nothing but a note.

Non-goals (design level): no second Markdown pass, no diagram state in the
`EditorAdapter`, no new vault capability, no `VaultStorage` change, no
worker-thread rendering.

## Decisions

**D1: A state field installs a block widget, mirroring `tableField`.**
The alternative, a view plugin (where `livePreview` lives), is forbidden: a
plugin's decorations may not replace line breaks. The reading view is also wrong,
because the editor's whole point is that the source is the surface.
The field recomputes only the fences an edit touched, using the same
`locatedRange` / `touches` / `widen` helpers the table field uses, so the per-edit
work is bounded by the edit and not by the document.

**D2: The widget is a placeholder that registers, because drawing is async.**
A `WidgetType.toDOM()` is synchronous; `mermaid.render()` returns a promise. So
the widget builds the block's box (`<figure class="folio-diagram">` with a
placeholder), registers the fence's source text with a module-level diagram
cache, and is filled when the promise settles. This is the `assetImages`
lifecycle moved from bytes to SVG.
`eq()` compares the source text only, so an edit elsewhere in the document reuses
the existing element and never touches the engine.

```
  transaction -> diagramField -> DiagramWidget(source)
                                     |
                          toDOM(): <figure> + register(source)
                                     |
                     cache: Map<source, { state, svg, elements }>
                                     |
                    queue (one at a time) -> mermaid.render()
                                     |
                     fill every live element for that source
```

**D3: The reveal rule is the table's, and it is what pays for the typing budget.**
While the selection overlaps the fence, the fence renders as source and no
diagram is requested. Two consequences matter:

- Typing inside a diagram cannot reach the engine.
- Typing outside it cannot invalidate it, because `eq()` sees unchanged text.

The widget declines the press (`ignoreEvent` false, as `TableWidget` and
`ImageWidget` do), so a press places the caret in the block and the source
appears. That satisfies the "pressing a diagram reveals its source" scenario
without a click handler.

**D4: Rendering is scoped to the viewport, with one render in flight.**
`mermaid.render()` mutates global state and is not reentrant (the board's
`mermaid-to-excalidraw` ships its own queue for the same reason). So the cache
keeps a single sequential queue, and elements are registered with an
`IntersectionObserver` against the pane's scroll container, reusing the
observer factory seam `assetImages` already has so the lifecycle is unit-testable
without a browser. A source whose last live element leaves the viewport releases
its SVG, exactly as an image releases its object URL.

**D5: Failure keeps the source, adds a note, and remembers.**
`mermaid.parse()` then `render()`; either failing marks that source text as
failed, so scrolling does not retry it, and the block shows its source plus a
presentational note. No dialog, no toast, no error surface. The same rule serves
the deck, where a failed diagram simply stays a `<pre>`.

**D6: The palette is a config we own, applied per render.**
`theme: 'base'` with `themeVariables` mapped from DESIGN.md's tokens (parchment
surface, warm ink, brand accent for the lines, the interface font), and
`securityLevel: 'strict'`, `startOnLoad: false`. The alternative, the engine's
default theme restyled by CSS, cannot reach inside the SVG reliably.

**D7: Serialized config, shared singleton, initialize before every render.**
`@excalidraw/mermaid-to-excalidraw` calls `mermaid.initialize()` and
`mermaid.render()` on the same module instance the app would use. Two writers of
one global config is a real collision, so the rule is: set the configuration
immediately before rendering, inside the queue. The alternative, forcing a second
mermaid copy, buys isolation at the price of a duplicated parser and a second
precache decision, and is not worth it.

**D8: `mermaid` gets its own chunk group, out of the board's and out of the precache.**
A new group at a priority above the `excalidraw` group, matching `mermaid/`,
`@mermaid-js/`, and the diagram-only libraries (`dagre-d3-es`, `d3-*`,
`cytoscape*`, `katex`, `khroma`, `@upsetjs/`), with `includeDependenciesRecursively`
off and the shared libraries (`react`, `dompurify`, `roughjs`) left in `vendor`.
Without this, the first diagram on a page fetches the board editor with it.
`globIgnores` gains the group's files, so the offline install still carries
neither engine. Verification is a build check: `index.html` preloads no diagram
chunk, and the opening page imports none.

**D9: The presentation mounts the same engine through its own DOM pass.**
`render.ts` emits `<pre><code class="language-mermaid">` already, and a slide is
an HTML string inserted as a whole, so a widget is useless there. `PresentationView`
gains one pass beside `syncAssetImages` that finds a slide's mermaid `<pre>` and
swaps in the drawn SVG. The alternative, rendering diagrams inside `render.ts`,
would make a pure string walk asynchronous and DOM-dependent.

**D10: The gate is computed once, and off means nothing happens.**
`features.diagrams` (`VITE_DIAGRAMS === '1'`, off by default) plus the app-level
prerelease switch, computed once in `App` as today's `agentEnabled` is, and passed
to the pane and to the presentation. While off, the field is not installed, the
pass does nothing, no fence renders, and the engine is never fetched.

## Cost and its measurement

The keystroke path gains: one state-field update over the transaction's touched
ranges, one decoration-set rebuild for the visible region, and (when the
selection leaves a fence whose text changed) one queued render. Nothing on that
path reads the vault, sorts, or allocates per item.

Measured during the change (task 1.3), in Chromium on the dev server, the way the
tests run it:

| What | Measured | Note |
| --- | --- | --- |
| Long tasks while typing 68 characters, a drawing on screen | 0 (none over 50 ms) | Same as the identical page with no drawing: the keystroke path does no diagram work |
| Same page, no drawings | 0 (none over 50 ms) | The control |
| Boxes the editor mounted on a 20-diagram page at open | 8 of 20 | CodeMirror mounts only the widgets its viewport reaches; the other 12 register nothing and draw nothing |
| Time from opening a 20-diagram page to its first drawing | 1.07 s | Cold, dev server: includes fetching and evaluating the engine chunk, not just the render |
| One `mermaid.render()`, cold, per kind | flowchart 317 ms, sequence 41 ms, class 577 ms, gantt 2 675 ms | First render of a kind pays the diagram type's own module setup |
| One `mermaid.render()`, warm, per kind | flowchart 31 ms, sequence 16 ms, class 32 ms, gantt 7 ms | Subsequent renders of the same kind |
| Paint after a warm render | 1.7 to 8.1 ms (gantt 641 ms) | Layout and paint of the produced SVG; gantt's own first paint is heavy |
| Engine bytes on the first drawing | One lazy chunk: 3.19 MB raw / 855 KB gzip | The board chunk is not fetched with it |

## Risks / Trade-offs

- **A block widget changes how a fence is clicked.** → The caret lands on the
  fence as it does on a table; `tableField`'s behaviour is the acceptance bar.
- **Main-thread render stalls on a big diagram.** → One at a time, only when
  visible, and the measured number in the table above; if a single render proves
  too slow, the fallback is a "render on demand" affordance, which is a change of
  its own.
- **The global config is shared with the board editor.** → D7. Verified by a test
  that renders a page diagram after a board conversion.
- **A diagram's SVG is retained while visible.** → Released on exit, bounded by
  the viewport, so the retained set follows the screen and not the page.
- **SVG output is generated markup, not escaped text.** → `securityLevel:
  'strict'` plus the DOMPurify already in the dependency graph; the app still
  never inserts page-authored HTML of its own.
- **The engine is large for a user who never draws one.** → Lazy, excluded from
  the precache, and off behind the flag until the capability is promoted.
- **The first drawing of a kind blocks the main thread while it renders** →
  Measured at 317 ms for a flowchart, 577 ms for a class diagram, and 2 675 ms for
  the first gantt. It happens once per kind per session, only when a fence of that
  kind is on screen, and never on the typing path, because the source shows while
  the caret is in the fence. The alternative (a detached worker) is not available:
  the engine measures text in the document and is one global singleton. If a
  drawing of that length proves unacceptable in use, the fallback is a per-block
  "draw it" affordance, which changes the spec's reveal rule and would be a change
  of its own, not a quiet exception here.

## Open Questions

- Whether a failed diagram should name the reason (a parser message) or stay
  silent. Deferrable: the note's text is one string either way.
