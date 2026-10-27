# Proposal

## Why

Presenting is built but switched off. The view, the deck derivation, navigation,
fullscreen, and image resolution all exist, and the `presentations` spec already
requires the feature. What is missing is the renderer: the current static block
renderer emits headings, fenced code, and escaped paragraphs only, so a slide
would show `**bold**`, lists, links, tables, and blockquotes as literal text.
The swap to CodeMirror hid the page-row entry rather than ship a deck that reads
worse than the page it presents.

The demo now has a Presenting guide page that tells people to use the feature,
so the gap is visible to a newcomer.

## What Changes

- Re-enable the page row's **Present** menu item.
- Replace the stub renderer with a real read-only Markdown renderer shared with
  the table-cell inline renderer already in the editor:
  headings, paragraphs, emphasis, strong, strikethrough, inline code, links,
  images, nested ordered and unordered lists, blockquotes, fenced code, GFM
  tables, and Folio reference chips.
- Keep the presentation surface unchanged: full-viewport dialog, one slide at a
  time, keyboard navigation, position/progress, fullscreen, vault image
  resolution, and no writes.
- Add tests for the renderer, the real adapter's static blocks, the restored
  entry, and the demo's Present flow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The `presentations` spec already specifies the entry, slide rendering,
navigation, fullscreen, and the no-write rule; this change implements it. The
change declares `skip_specs: true` because no requirement text changes.

## Impact

- `src/markdown/render.ts` (new): the shared inline and block renderer.
- `src/editor/codemirror.ts`: uses the shared renderer for table cells and
  static presentation blocks.
- `src/components/Sidebar.tsx`: the Present entry returns.
- `src/components/PresentationView.module.css`: reference chips inside slides.
- Tests: the renderer unit test, the CodeMirror integration test, App
  integration tests for the entry, and a Playwright check of the demo's
  Presenting page.
- No dependency, no storage, no editor behavior change, and no work on the
  typing path. The renderer runs only when Present is activated.

## Non-goals

- No new keyboard chord, speaker notes, slide transitions, exports, or presenter
  mode.
- No editing or formatting controls in a slide.
- No new Markdown grammar or renderer dependency: the renderer reuses the
  app's reference scanner and the table cell's inline rules.
- No reference navigation from a slide: chips are styled text there, as the
  archived design accepted.
- No change to a page's Markdown or to what Presenting writes (nothing).
