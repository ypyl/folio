## Context

See `proposal.md` for why. Facts that shape the approach:

- Nothing styles `img` today: `EditorPane.module.css` has rules for paragraphs, headings, code, lists, and tables, and not one for images. A vault image therefore renders at its natural pixel width inside `.document`'s `padding: 4px 32px`, and the pane clips it.
- The pane is the scroll container (`.pane`, `overflow-y: auto`, `min-width: 0`). Per CSS, an axis left `visible` beside a non-visible one computes to `auto`, so the pane already scrolls horizontally to anything wider than its content box.
- The pane owns the vault-image pass (`src/editor/assetImages.ts`): on a document change and on the page seed it walks `host.querySelectorAll('img')` and swaps a vault-relative `src` for a `blob:` URL, once per path per page. It mutates the rendered element only; the node's `src` stays the markdown path (ADR-0001).
- ProseMirror owns the DOM under `.ProseMirror`. `render-vault-images` chose a DOM pass over a node view (its design D2) because resolution needed nothing from the editor; that reasoning does not carry over to a control that has to live inside the editable surface.
- The table handles are the precedent for a control that sits on content: hidden until the pointer is on the line they belong to, an 18px `--ivory` chip with a `--border` hairline, `--stone` glyph, hover `--warm-sand` / `--brand`, and `visibility` rather than `display` so the component can still measure them.
- Milkdown's commonmark preset gives the image node `toDOM` returning a bare `<img>` (`src`/`alt`/`title`), `inline`, `atom`, `selectable`, `draggable`. `$view(imageSchema.node, ...)` replaces that with a Folio-owned node view; `@milkdown/utils` and `@milkdown/preset-commonmark` are already declared dependencies, and `@milkdown/prose/view` types are already imported elsewhere in `src/editor/`.

## Goals / Non-Goals

**Goals:**

- One width rule and one control, both expressed where they cost nothing per keystroke.
- The image stays the node's presentation: no new node attributes, no new markdown, no stored state.
- Vault image resolution is untouched: same read-once-per-path behavior, same pane-owned cache, no vault knowledge in the editor internals.

**Non-Goals:**

- No pixel width computed in JS, no drag-to-resize, no persisted size.
- No lightbox, no click-to-open, no caption or figure node.
- No change to which images are fitted: vault references only, exactly the set resolution already distinguishes.

## Decisions

### D1 The fit is CSS, not a measured width

The image is capped by `max-width: 100%` against the pane's content width, and `height: auto` keeps the aspect ratio. A wide image scales down; a narrow one is unaffected (`max-width` never stretches), which is the "never upscaled" rule for free. The pane's own resizes (window drag, sidebar toggle) re-fit every image without any JS, so nothing about the fit can land on the keystroke path or on a resize pass.

Rejected: measuring the pane and setting an explicit pixel width. It needs a `ResizeObserver` pass, a layout read per image per document change (where the gutter already measures), and it re-derives on every keystroke what the browser's own layout already knows.

### D2 A node view owns the image's DOM

`src/editor/vaultImageView.ts` registers `$view` over the commonmark image schema and returns a node view whose `dom` is a `span.folioImage` holding the `<img>` and the toggle button. The control has to be a real element inside the editable surface (that is what "a button on the image" means), and a node view is the only sanctioned way to put Folio-owned DOM there: the alternative — injecting a wrapper and a button into the `.ProseMirror` subtree from the pane's DOM pass — puts a `childList` mutation inside a textblock, which ProseMirror reads back as content, re-parsing or splitting the paragraph under the user's caret. For a node view, the DOM is the view's own: mutations inside it are ignored (`NodeViewDesc.ignoreMutation` ignores everything when there is no `contentDOM`), and the schema's `toDOM` is no longer consulted, so the wrapper never leaks into the clipboard (`serializeForClipboard` builds HTML from the node, not from the DOM).

The node view is deliberately dumb: no vault import, no reader, no cache, no React. It renders attributes it is handed and toggles one attribute on itself.

The alternatives: an overlay of absolutely positioned controls outside `.ProseMirror` (the gutter's pattern) needs each button measured and positioned against its image on every document change — layout reads and per-image work on the keystroke path — and it would have to keep the button in step with a subtree ProseMirror may replace at any time. A widget decoration with an absolutely positioned button cannot anchor to the image's corner: the widget's containing block is the block the image sits in, not the image. Both cost more and buy less.

This reverses the "no Milkdown node view" note in `render-vault-images` (its design D2), and that note still holds for what it was about: asset **resolution** stays in the pane's pass, and `MilkdownAdapter` gains no vault dependency. What changed is that the image now needs Folio-owned view state.

### D3 The fit and the control key off the vault reference, not the resolved URL

The node view branches on `isVaultRelative` (exported from `assetImages.ts`, the same predicate resolution uses): a vault reference gets the wrapper and the control, everything else keeps a bare `<img>` — so a remote image is neither fitted nor given a control, and no CSS has to sniff URL schemes.

The one thing the predicate cannot know is whether the read succeeded. An unresolvable path renders as a broken image, which must carry no control, so the control's reveal selector additionally requires the resolved bytes (`img[src^='blob:']`, matching what the pass writes into the attribute). That is a Chromium-supported `:has()`, the same device the empty-cell hairline uses.

### D4 Expanded is one attribute on the node view's own element

Activating the control sets `data-expanded` on the wrapper (and flips the button's `aria-label` and `title`); CSS turns that into `max-width: none` on the wrapper and the image, which is the image's own size — no pixel value is computed or stored anywhere. The state lives only in the DOM, so it dies with the page's editor: a page switch remounts the pane and the image comes back fitted, as the spec requires. Nothing is written to the markdown, and nothing to `.folio/`.

### D5 The control's reveal matches the table handles, with a keyboard path

The control is an 18px chip in the image's top-left corner, `opacity: 0` and `pointer-events: none` at rest, revealed (opacity 1, pointer events back) while the pointer is over the wrapper, while the control has focus inside the wrapper, or while the image is expanded — so it stays reachable while expanded and after a click. `opacity` rather than `display`/`visibility` is what keeps it in the tab order: a keyboard user reaches it with Tab, focus reveals it, and the app's global `:focus-visible` outline draws it. Top-left, not top-right, so an expanded image that overflows to the right leaves its own control on screen without scrolling. (A pointer-less touch device gets no reveal, the same limitation the table handles have.)

### D6 What the node view must not break

- Resolution: the pass still finds the `<img>` (`querySelectorAll('img')` reaches into node views) and writes the `blob:` URL into the `src` attribute. The node view's `update` compares the node's `src` to the value it last bound and writes only on a real change, so a reconciliation can never reset a resolved URL back to the vault path.
- Dragging: ProseMirror initiates a node drag from the nearest view description, so the image stays draggable from its own DOM; the node view must not set `draggable` itself.
- The caret and the gutter: the wrapper is an inline-block whose only child in flow is the image, so its baseline and the block's height are what they were; the gutter's per-block measurements are unchanged.

### D7 The pane scrolls an expanded image for free

No CSS is added for the overflow: `.pane`'s `overflow-x` already computes to `auto` beside `overflow-y: auto`, so an expanded image wider than the pane gives the pane a horizontal scrollbar. This is one of the things the change's browser check measures rather than assumes, because it is a computed-value rule rather than a declared one.

## Risks / Trade-offs

- [`max-width: 100%` on an image inside a shrink-to-fit `inline-block` wrapper is a percentage against the wrapper's containing block, and the wrapper's own width is content-derived] → Chromium is expected to resolve both against the paragraph's content box; the browser check measures a wide image's fitted width against the pane's content width, and if the wrapper misbehaves the fix is to move `max-width` onto the wrapper and let the image fill it.
- [A node view is Folio's first, so a future Milkdown upgrade can change the image node's shape under it] → the node view reads only `src`, `alt`, and `title` and has its own unit test; the ADR records that the image node's DOM is now Folio's.
- [The control is invisible at rest, so the expand affordance is discoverable only by pointing at the image] → accepted: it is the table handles' rule, and it keeps the document free of chrome; the button still answers Tab and names its action.
- [An expanded image's horizontal scrollbar changes the pane's content width by the scrollbar's thickness, so the fitted images beside it re-fit] → the re-fit is the browser's own layout pass, and the pane keeps the scrollbar while any image is expanded, so it does not oscillate.
- [State is lost on a page switch] → required by the spec, and cheaper than persisting it: no store, no invalidation, no markdown.
- [A very tall image's fitted size can still exceed the viewport height] → out of scope; the pane scrolls vertically as it does today.

## Migration Plan

None. No persisted state, no interface change, and no change to `VaultStorage` or the vault's files. Reverting the change removes the node view and the CSS and leaves the vault untouched.
