# Design

## Context

See proposal.md - Why. `EditorAdapter.staticBlocks()` returns one `StaticBlock`
per top-level block from `blockStartLines`; `deriveSlides` splits on the `hr`
type; `PresentationView` renders the current slide's HTML and resolves vault
images. Only `blockHtml`/`cellHtml` in `codemirror.ts` are incomplete. The
`cellHtml` inline renderer already handles emphasis, strong, strikethrough,
inline code, links, and reference chips for rendered tables; it does not handle
images.

## Goals / Non-Goals

**Goals:**
- A slide renders the constructs the `presentations` spec names.
- One inline renderer for table cells and slides, so they cannot drift.
- No dependency and no second Markdown grammar.

**Non-Goals:**
- Full CommonMark coverage (definitions, footnotes, HTML blocks, autolink
  variants beyond the obvious).
- Interactive reference chips or vault-link opening from a slide.

## Decisions

**D1 - Move the inline renderer into a shared module and extend it.** The
existing `cellHtml` walk becomes `renderInline` in `src/markdown/render.ts`.
`codemirror.ts` imports it for table cells, and the block renderer uses it for
every inline run. The walk still escapes every literal character, so the only
tags in the output are the ones it emits. Images are added as
`<img src alt>`: the presentation's existing `syncAssetImages` pass resolves a
vault path to a blob URL exactly as it does for the editor, and an external URL
is left for the browser. Links gain `target="_blank"` and `rel`, so a slide
cannot navigate the app away. Reference chips keep the `.ref` class and their
data attributes; the slide stylesheet paints them.

**D2 - Render block structure with the app's existing block boundary.** The
renderer takes the same block bodies `staticBlocks` already produces, so
`blockStartLines` remains the one rule for where a block starts. A heading
renders with its depth; a paragraph renders its inline content; a list is parsed
into items and nested lists by indentation; a blockquote strips its markers and
renders its inner blocks recursively; a table reads its header, delimiter,
alignment, and rows; a fenced block (backticks or tildes) renders its language
and escaped code; a thematic break renders `<hr>` (the deck drops it as a
boundary). Raw HTML in the Markdown is escaped, not executed.

**D3 - The reference chip is shared, not re-implemented.** The inline renderer
already scans with `findReferenceRanges` and emits `.ref` spans. Keeping that in
the shared module means a table cell and a slide render a reference the same
way, and the presentation stylesheet only adds the chip paint. The chips are not
interactive in a slide: the dialog has no page-navigation handler, and the spec
does not ask for one.

**D4 - The entry is the flag.** `PRESENT_ENABLED` becomes true. The row menu,
`App.handlePresent`, the `pendingPresent` hand-off for a page that is not open,
and `PresentationView` are already wired and tested; the renderer was the only
missing piece. The entry stays page-row only, so a journal day or a page with no
file still has no affordance.

**D5 - The cost is a Present click, not a keystroke.** The renderer runs inside
`staticBlocks()` when App builds the deck, once per Present activation. Table
cells call `renderInline` only when a table widget is built, exactly as they do
today. Nothing in the renderer is reachable from the typing path.

## Risks / Trade-offs

- [Raw HTML in a page could be injected into a slide] -> every literal character
  is escaped; the renderer never passes source HTML through.
- [A link in a slide could navigate the app away] -> links open in a new tab
  with `noopener noreferrer`; vault links are rendered as links but the deck
  does not navigate the app.
- [The renderer is a partial Markdown implementation] -> it covers the
  constructs the presentations spec names; anything it does not know stays
  escaped text rather than disappearing or executing.
- [The shared inline renderer now emits images in table cells] -> that is a
  read-only improvement; the table tests already assert the existing inline
  output and are extended for images if needed.
- [Slides may look different from CodeMirror's live preview] -> the source text
  stays the canonical page, and the deck is a reading surface; the renderer
  matches the app's Markdown constructs rather than its source-view markers.
