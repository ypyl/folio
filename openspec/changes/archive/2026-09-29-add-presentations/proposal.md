## Why

Folio holds a folder of Markdown, and a Markdown document is already a capable script for a
talk: headings, bullets, code, and tables. Today that content can only be read in the editor.
A user who wants to present notes has to leave Folio for another tool and keep two copies of
the same text in sync. Presenting the open page in place turns a page the user already wrote
into a deck, without a second file kind and without a second authoring format.

## What Changes

- Present the **currently open page** as a full-viewport slide deck, one slide at a time.
  Presenting is entered by an explicit gesture from an open page and exited with `Esc`; the
  editor is untouched before and after.
- A slide boundary is a **top-level thematic break (`---`)**. Content before the first break
  is the first slide; a page with no break is a single slide. A `---` inside a fenced code
  block or an inline code span is content, not a boundary.
- Slide content renders through Folio's existing Markdown grammar and schema (ADR-0008): the
  same headings, paragraphs, lists, links, code, blockquotes, and tables the editor shows,
  plus vault images resolved from their bytes. Presentations add **no second Markdown
  renderer** and **no new rendering dependency**.
- Navigation by keyboard (`ArrowRight`/`ArrowLeft`, `Space`, `PageDown`/`PageUp`, `Home`,
  `End`) and by on-screen controls, with a slide counter and a progress indicator.
  `F` toggles fullscreen; fullscreen is not forced on entry.
- Presenting is **view-only and leaves no trace**: the page's Markdown and its file are never
  written, and presentation state (current slide, fullscreen) is session-only.
- The presentation surface reuses the Kami design tokens (`DESIGN.md`); it loads nothing from
  a network, so it works offline like the rest of the app.

### Non-goals

- **Separate deck files.** A deck is the open page, not a file kind. There is no `decks/`
  directory, no slug matching, no new index or sidebar entry.
- **Speaker notes and a two-window presenter mode.** Deferred; the first version presents to
  the room only.
- **Reveal.js or any CDN-hosted presentation library.** The app is local-first and offline;
  the slide surface is the app's own.
- **A second Markdown renderer or a rendering dependency** (for example `react-markdown`).
  ADR-0008 records Milkdown replacing that stack; slides reuse the editor's grammar.
- **Editing, comments, drawing, transitions, fragments, PDF export, or recording.**
- **Presenting a page that is not open**, and presenting without a vault folder.
- **Changing how a page opens.** `page-editing`'s "no read-only preview" rule still governs
  opening a page; presentation is a distinct, explicitly entered mode over the open page.

## Capabilities

### New Capabilities

- `presentations`: turning the open page into a full-viewport, view-only slide deck, with
  slide boundaries derived from the page's top-level thematic breaks, keyboard and control
  navigation, and no writes to the vault.

### Modified Capabilities

- `page-editing`: adds a Present control to the editor pane for the open page (a new
  requirement; no existing page-editing requirement changes). Opening a page still opens the
  editable editor exactly as before — this capability does not alter that.

## Impact

- **UI**: a new presentation surface and modal presentation view; a Present entry control in
  the editor pane; the workspace is covered by the deck while presenting.
- **Editor layer**: a read-only rendering path over the editor's Markdown grammar (a slide
  renderer), kept behind the existing editor/vault separation (ADR-0010). No change to how
  the editable editor parses or serializes.
- **Architecture**: no new file kind, no index/sidebar/search change, no `VaultStorage`
  change, no new runtime dependency, no backend. The Markdown file stays canonical and is
  never written by this feature (ADR-0001).
- **ADRs**: consistent with ADR-0006 (scope restraint), ADR-0008/0009 (Markdown stays the
  document model; one rendering path), ADR-0010 (editor/vault separation), ADR-0011 (Kami
  design language). No new ADR is required; if the read-only rendering path settles a durable
  boundary, a follow-up ADR can record it.
