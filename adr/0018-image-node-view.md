# ADR-0018: Folio owns the image node's DOM through a node view

- Status: Accepted
- Date: 2026-09-15

## Context

Images render through the commonmark preset's schema (ADR-0008): the node's `toDOM` produces a bare `<img>`, and ProseMirror owns that element. `render-vault-images` deliberately kept vault-image resolution out of the editor — a pane-owned DOM pass rewrites the element's `src` to a `blob:` URL while the page's Markdown keeps the path it had — and rejected a node view for that job.

Images now need to read at the pane's width with a control that expands them to their own size (`fit-vault-images-to-pane`). That control has to be an element *inside* the editable surface, sitting in the image's corner and pressable. Folio cannot add one from outside: DOM injected into the `.ProseMirror` subtree is a mutation ProseMirror reads back as document content, so a wrapper and a button planted inside a paragraph would be re-parsed, or split the paragraph, under the user's caret.

The question is therefore not how the control looks but who renders the image element. Two shapes answer it: Folio takes the node's DOM, or Folio draws the control outside ProseMirror and positions it over the image.

## Decision

Take the image node's DOM.

- Register `$view` over the commonmark image schema (`src/editor/vaultImageView.ts`, wired with `.use(vaultImageView)`): the node view renders `span.folio-image` holding the `<img>` and the expand/collapse `<button>` — for a reference into the vault, and only for one.
- A reference that is not a vault path keeps a bare `<img>`: no wrapper, no fit, no control. A `src` that crosses between vault path and URL is reported as a rebuild rather than an update, so the element always matches the side of that line its node is on.
- The view is only a view. It reads `src`, `alt`, and `title`, and toggles one attribute on itself; it imports no vault, no reader, no React, no resolver. Asset resolution stays exactly where `render-vault-images` put it, in the pane's pass, and the view writes a `src` only when the node's own value really changed, so the resolved `blob:` URL survives every reconciliation.
- The fit and the expanded size are CSS (`max-width: 100%`, lifted to `none` under `data-expanded`), so no pixel value is measured, stored, or persisted. The expanded state lives in the DOM and dies with the page's editor.
- ProseMirror's contract for a node view is honoured rather than assumed: the control is hidden with `opacity` so it stays in the tab order, `stopEvent` claims the control's events, and the schema's `toDOM` is simply no longer consulted for images.

Rejected: injecting the wrapper and the control into the `.ProseMirror` subtree from the pane's DOM pass. ProseMirror reads child mutations inside a textblock as content, so the paragraph would be re-parsed or split mid-typing; a node view's DOM is the view's own, and mutations inside it are ignored.

Rejected: an overlay of absolutely positioned controls outside `.ProseMirror`, each placed over its image (the gutter's pattern). It needs every control measured against its image on every document change — layout reads and per-image work on the keystroke path — and the controls would have to track a subtree ProseMirror may replace at any moment.

Rejected: a widget decoration holding an absolutely positioned button. A widget's containing block is the block the image sits in, not the image, so the button cannot reach the image's corner without measuring anyway.

Rejected: putting the size in the document — an attribute on the node, or a width in the Markdown. It writes presentation into the file and needs a rule for pages that carry none (ADR-0001, ADR-0009), for a state the user can toggle back at any time.

This supersedes nothing. The "no node view" note in `render-vault-images` was about resolution, and resolution has not moved.

## Consequences

- Image presentation is Folio's from here: the schema's `toDOM` no longer renders images, so a later image feature (sizing, alignment, captions) starts from `vaultImageView.ts` rather than from the preset.
- Editing a `src` between a vault path and a URL rebuilds the element, which is what the shape difference costs. Within either shape, attribute edits update in place.
- The DOM around a vault image is a `span` rather than a bare `<img>`, so anything walking the editor DOM (the resolution pass, the block measurements behind the gutter) sees one extra inline box. Baselines and block heights are unchanged, and the extra inline box is the reason the fit needs no measurement of its own.
- ProseMirror's automatic `contenteditable=false` and `draggable` do not apply to a custom node view: dragging still works because the editor marks the node's DOM draggable during a press, a click still selects the node, and the remote-image shape keeps the bare `<img>` the schema always produced.
- Two global class names join the editor surface (`.folio-image`, `.folio-image-control`), styled from the pane's stylesheet like the badge and struck-run classes.
- Remote, `data:`, and unresolvable references are out of the feature by construction rather than by a rule: they never get a wrapper, so there is nothing to fit and nothing to press.
