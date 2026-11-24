# ADR-0037: A diagram is a render of a fence, not a file

- Status: Accepted
- Date: 2026-11-22

## Context

A page can now hold a picture with a source: a fenced block whose info string is
`mermaid` is drawn from its own text (add-mermaid-diagrams). The app already had
a picture of that shape, the whiteboard, and it is a different thing: a board is
a `.excalidraw` file the app creates, edits, and writes (ADR-0024), opened from a
`#!` token, listed in the Files listing, and searched by name.

A fenced diagram sits on the opposite side of that line. Its text is the page's
own content, so the picture is derived from the page and nothing else. The
temptation, once rendering works, is to grow it backwards: a sidecar file to cache
the SVG, an index entry to find it, a separate surface to edit it as a picture.
Each of those turns a derived view into state, and every one of them fails
ADR-0001: the `.md` files would no longer be the whole story.

## Decision

A diagram is a view-only rendering of a fenced block, in the same class as a
rendered table, a rendered image reference, and a hidden emphasis marker
(ADR-0029). It is a decoration over the page's Markdown, produced while the
surface shows it and gone when it does not.

Consequences that follow from that and are not negotiable:

- **Nothing is written.** No file, no sidecar, no cache on disk, no index entry,
  no page, no board, no backlink, no favorite. Opening a page with a hundred
  diagrams writes nothing.
- **The source is the editing surface.** The drawing shows while the caret is off
  the fence and its Markdown shows while the caret is on it, which is the table's
  rule and the image's rule. There is no canvas, no node dragging, and no
  round-trip that could rewrite the text.
- **The drawing is derived data and lives no longer than the display need.** It is
  cached in memory, keyed by the fence's source text, scoped to the viewport, and
  released when its last element leaves.
- **A drawing that fails is text.** The block keeps its source and gains a note;
  a rejection never turns into a broken box or a lost paragraph.

Editing a diagram as a picture is a whiteboard, and that already exists: write the
`#!` token. The two forms are chosen by what the user wants, not converted into
one another.

## Consequences

- The engine is fetched only when a drawing is needed and stays out of the offline
  install, like the board chunk. A vault with no diagram pays nothing, which is
  what made it acceptable to ship behind a flag first; the capability now ships
  in every build (release-mermaid-diagrams), so the flag and the experimental
  switch no longer touch it.
- The diagram's content is page text, so page search already finds it and a hit
  lands the caret in the fence, showing the source. Nothing extra was built for
  that.
- A drawing cannot be exported, copied as an image, or shared as a file by the
  app. Anything of that sort would be a change to this decision, not an addition
  to it.
- The engine is a global singleton shared with the board editor's paste path, so
  every render in the app is serialized and sets its own configuration first. That
  coupling is the price of one dependency instead of two.
