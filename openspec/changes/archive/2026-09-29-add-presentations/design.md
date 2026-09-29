## Context

See `proposal.md` for motivation. The constraints that shape this design:

- The editor is Milkdown (ADR-0008), and ADR-0008 records Milkdown **replacing**
  `react-markdown` + `remark-gfm`. There is one Markdown grammar in the app, and it lives in
  the editor layer. Slides must reuse it rather than add a second.
- `App` owns the open page (`activePath`, `page`), the editor via `editorRef`
  (`EditorPaneHandle`), the shell (`workspace` + `StatusBar`), and the vault storage seam
  (`activeFolder.storage`). A board already establishes a non-page view; a presentation is a
  transient overlay over the same page, not a fourth document kind.
- The editor adapter (`MilkdownAdapter`) already holds the parsed ProseMirror document and
  the schema contexts (`parserCtx`, `schemaCtx`). `EditorPane` already owns lifecycle, and
  `src/editor/assetImages.ts` already resolves vault-relative `<img>` sources over an
  arbitrary DOM subtree through `readBinary`.
- The editor-responsiveness budget (AGENTS.md): presentation is off the typing path, but the
  feature must not add work proportional to the document on a keystroke, and derived data
  must be rebuilt only when its input identity changes.

## Goals / Non-Goals

**Goals:**

- Turn the open page into slides with no new file kind, index change, dependency, or network
  access.
- Derive slides from the page's Markdown through the editor's own grammar, so a thematic
  break inside a fenced code block is content, not a boundary, and a slide looks like the
  document it came from.
- Keep the presentation a view: read-only, ephemeral, and out of the vault's write path.
- Make the derivation pure and testable, and keep navigation free of parsing and IO.

**Non-Goals:**

- Speaker notes, presenter mode, or a second window.
- Deck files, slug matching, or any new vault file kind.
- Transitions, fragments, PDF export, recording, or remote control.
- Rendering Folio reference badges (`#Page`) in slides; a reference token renders as its
  literal text, as it does in any Markdown reader.
- A keyboard chord to open a presentation; the entry is the pane control.

## Decisions

### D1: The entry control is a Present button in the editor pane

The pane offers a Present control while a page is open. The status bar is tempting as a
global action home, but its spec makes the Back, Forward, Today, and pin controls the bar's
**only** controls, so putting Present there would rewrite a deliberate constraint. The pane
is already the open page's surface, and a control anchored in the pane's top-right corner is
additive and does not touch the content column's geometry.

Alternative considered: a status-bar control (rejected, rewrites ui-shell's "only controls"
rule); a keyboard chord (rejected for v1 — undiscoverable, and it would need the shortcuts
reference and its apply path).

### D2: A presentation is a modal `<dialog>` overlay, not a fourth app mode

`App` gains one piece of state, the derived deck (`slides: string[] | null`). When non-null,
a modal `<dialog>` is rendered on top of the shell with the deck inside. The editor and shell
stay mounted underneath.

A modal dialog gives a focus trap and `cancel`-on-`Escape` for free (the platform feature
over custom code), and it keeps the editor instance alive: closing is a state flip, so the
page, its scroll position, and its caret return exactly as they were without a re-init.

Alternatives considered: a fourth value of `mode` alongside `page`/`results`/`board`
(rejected — it unmounts the editor, so closing must rebuild it and the "returns exactly as it
was" guarantee becomes work); a bare fixed overlay with a hand-rolled focus trap (rejected —
`<dialog>` already is that).

### D3: The deck is derived from the live editor document, through the editor seam

Add one method to the editor seam (ADR-0010), generic rather than presentation-specific:

```
staticBlocks(): { type: string; html: string }[]
```

where `type` is the top-level ProseMirror node's type name and `html` is that node
serialized with the schema's `DOMSerializer`. `MilkdownAdapter` implements it from the
editor it already holds; `EditorPane` exposes it on `EditorPaneHandle`; `App` calls it once
when the Present control is activated, before showing the dialog.

The presentation layer owns slide policy as a pure function over those blocks:

```
deriveSlides(blocks): string[]
  - a block of type 'hr' closes the current slide
  - a slide with no non-'hr' block is dropped
  - no top-level 'hr' => one slide
```

Why from the document and not from the Markdown text: a raw split on `---` would cut a
fenced code block in half, and a second Markdown parser would be exactly the second grammar
ADR-0008 removed. Serializing the already-parsed document reuses the schema, needs no new
dependency, and turns nested breaks into non-boundaries by construction (an `hr` inside a
blockquote is that blockquote's child, never a top-level sibling). Each slide comes out as
static HTML — no caret, no editor controls, and no CodeMirror code blocks — which is what a
slide wants.

Alternatives considered: `react-markdown` + `remark-gfm` (rejected — ADR-0008); a headless
Milkdown parser built solely for slides (rejected — it duplicates the editor's plugin and
schema setup); splitting the raw Markdown string (rejected — breaks on code fences); mounting
a read-only `EditorPane` per slide (rejected — drags in editor machinery and interactive
surfaces that are wrong for slides).

### D4: Vault images resolve through the existing asset-image pass

Serialized slides carry `<img src="assets/…">`. The presentation view runs the existing
`syncAssetImages(host, cache, read)` over the current slide once it is mounted, with
`readBinary` from the active folder's storage, and `releaseAssetImages` on close. No new
resolution code, and the page's Markdown is untouched.

### D5: Slide HTML is inserted with `dangerouslySetInnerHTML`, and the deck is built once

The deck is a `string[]` computed once per Present activation and held in `App` state.
Rendering the current slide inserts its HTML directly (it came from the app's own serialized
document). Moving between slides is an index change over an already-built array: no
re-parsing, no re-serialization, and no vault read. A slide taller than the viewport scrolls
within the slide; slides are not scaled to fit, so type size stays legible.

Alternatives considered: re-deriving on each slide change (rejected — violates the cost
requirement and would rebuild derived data needlessly); scaling every slide to fit (rejected
for v1 — surprising type sizes, and overflow is an authoring concern, not an engine one).

### D6: Navigation and fullscreen

The dialog handles `ArrowRight`/`Space`/`PageDown`/`ArrowDown` (next),
`ArrowLeft`/`PageUp`/`ArrowUp` (previous), `Home`, and `End`, clamped at the ends with no
wrap. It shows `n / m` and a progress indicator. `F` requests fullscreen on the dialog
element; a refused request leaves the deck usable. `Escape` is the dialog's own `cancel`,
which while fullscreen fires after the browser has left fullscreen, so one `Escape` leaves
fullscreen and the next closes the deck.

### D7: Styling reuses the Kami tokens

The deck surface uses the app's existing Kami token variables (`DESIGN.md`): parchment
canvas, near-black text, ink-blue accents, no new colors, no shadows. Type is the app's
existing scale, sized up for the room.

## Risks / Trade-offs

- **The serialized HTML can drop editor-only presentation.** Reference badges and
  strikethrough are ProseMirror view decorations, not document nodes, so they do not appear in
  slides; reference tokens read as literal `#Page` text. → Accepted and non-goal for v1.
  Core constructs (headings, lists, emphasis, links, code, blockquotes, tables, images) come
  from the schema's own `toDOM` and render.
- **`dangerouslySetInnerHTML` renders raw HTML a page can carry.** → The trust model is the
  same as the editor, which already renders a page's own content; the vault is the user's own
  local folder. If a stricter boundary is wanted later, drop `html`-type blocks during
  derivation.
- **Deriving from the live editor couples entry to a mounted editor.** → Entry is only
  offered while a page is open, so the adapter exists; the deck is captured before the dialog
  opens, so the dialog itself depends on nothing live.
- **A very large deck holds all slides' HTML in memory at once.** → Slides are HTML strings
  of the page's own size; the alternative (re-deriving per slide) violates the cost
  requirement. Acceptable until a real deck shows otherwise.
- **Fullscreen/`Escape` ordering differs across browsers.** → The app is Chromium-first
  (ADR-0002); the dialog's `cancel` plus the fullscreen change give the specified two-step
  exit, and the browser-refusal path is covered by a scenario.
- **The seam grows a rendering method.** → Keep it generic (`staticBlocks`, node type names
  and HTML) so slide policy stays in the presentation layer; no knowledge-management logic
  crosses the seam (ADR-0010).

## Migration Plan

None. The feature is additive and stores nothing; there is no data to migrate and no
rollback path beyond removing the code.

## Open Questions

- Whether slides should render Folio reference badges and strikethrough. Deferrable: adding
  them later is additive and changes no spec.
- Whether a keyboard chord should open a presentation. Deferrable: the control is the v1
  entry; a chord can be added to the shortcuts reference without changing this approach.
