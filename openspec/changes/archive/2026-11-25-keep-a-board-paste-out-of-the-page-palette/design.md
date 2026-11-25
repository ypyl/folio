# Design

## Context

See proposal.md - Why. The pieces that shape the approach:

- `src/editor/diagrams.ts` owns the engine: `loadEngine()` imports `mermaid` once
  and returns `{ render(id, source) }`, whose `render` calls
  `mermaid.initialize(diagramConfig())` and then `mermaid.render(...)`. Page and
  deck drawings both go through it, serialized by the module-level `chain`.
- `diagramConfig()` is the app's palette, mapped into mermaid's `themeVariables`
  (the hex mirror of DESIGN.md's tokens).
- `@excalidraw/mermaid-to-excalidraw` (a dependency of Excalidraw, not of ours)
  calls `mermaid.initialize(merged)` only when `JSON.stringify(merged)` differs
  from the last one it used, inside `parseMermaid`. Excalidraw calls it with no
  config, so `merged` is the library's own constant.
- The converter reads its shape colours out of the SVG mermaid renders, so
  whichever configuration was installed at that moment is what the pasted
  elements inherit.
- The panes are exclusive: opening a board unmounts the editor and releases its
  drawing runtime, and the deck is a modal over the shell. Two renderers cannot
  draw at the same time, so a cross-renderer lock buys nothing.

## Goals / Non-Goals

**Goals:**

- The app's palette does not survive the drawing it was set for.
- A board paste is drawn by the board editor's own configuration, every time.
- A failed drawing restores the engine too, so a refusal cannot leave the palette
  installed either.

**Non-Goals:**

- No attempt to theme the board's paste. The board's converter initializes its
  own configuration on its first conversion of a page load and skips every later
  one, so the app cannot be the last writer before it without priming or patching
  a third party's cache. Two palettes for pastes is the current bug; forcing one
  is not reachable from here.
- No change to page or slide drawing, the palette, the cache, or the placeholder.

## Decisions

### D1: Snapshot and restore around each drawing, not a reset to defaults

The render wrapper captures `mermaid.mermaidAPI.getConfig()` before installing
the app's palette and calls `mermaid.initialize(snapshot)` when the drawing
settles. That hands the engine back in the state the next renderer put it in,
which is the only state the app can honestly restore. Resetting to mermaid's
defaults instead would make a fresh session's first board conversion and its
later ones use different font sizes and curve styles, which is a smaller version
of the same bug.

The restore runs in a `finally`, so a refused source restores too. The snapshot
is taken inside the serialized job, so page drawings cannot observe each other's
palette.

Alternative rejected: initializing the app's palette once at startup. The board's
conversion changes the configuration, so page drawings after a paste would be
drawn in the converter's palette.

Alternative rejected: passing the configuration per render. Mermaid's only entry
for configuration is `initialize`, which is global.

### D2: The seam is an exported function, so the restore is testable

`loadEngine` is private and mockable only through the engine, which is a fake in
the unit tests. The snapshot-and-restore lives in a small exported helper that
takes the mermaid-shaped object (`getConfig`, `initialize`) and the drawing job,
so `diagrams.test.ts` can drive the real logic with a fake engine and a fake
config, including the failure path.

### D3: The board's paste keeps the converter's palette

Pasted mermaid becomes native Excalidraw elements, and the converter's palette is
what its own preview showed in the dialog. The app's palette in those elements
would not match the preview and could not be guaranteed anyway. The app's job is
to stop interfering, not to take the converter over.

## Risks / Trade-offs

- [A board paste after a page diagram now looks different from today in some
  sessions] → It looks the same in every session, which is the point; the
  elements are editable, and the dialog's preview already showed that palette.
- [Mermaid publishes a new `getConfig` shape or the restore throws] → The restore
  is wrapped so a failure cannot fail the drawing; the drawing's own result is
  returned either way.
- [An Excalidraw upgrade starts passing its own config to the converter] → The
  restore still leaves the engine as it was found, so the converter's own
  configuration wins by its own rule; nothing here depends on its cache.
- [A future renderer in the app relies on the palette staying installed] → The
  palette is applied by the drawing wrapper right before each drawing, so every
  app renderer sets it itself.
EOF
