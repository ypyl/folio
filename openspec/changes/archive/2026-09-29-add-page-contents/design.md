## Context

The right panel is `MetaPanel`, fed by rows `App` memoizes on `[graph, page]`; its sections are `Accordion` (`<details>`) bands. Two existing pieces make Contents cheap:

- `blockStartLines(markdown)` (`src/lineAnchors.ts`) returns the 1-based start line of every top-level block, and that position is the **block index** the editor's `highlightBlock(index)` and search both use. A heading's block index is therefore already defined.
- `App` already carries `matchHighlight: { block, nonce } | null` and passes it to `EditorPane`, whose effect calls `adapter.highlightBlock(block)`. Search sets it today; Contents can reuse the same "locate a block" path.

`App` builds a page's outgoing rows separately: `forwardlinkRows` (page references → navigate) and `referenceRows` (assets and boards → open), and `handleOpenAsset` already branches boards vs. files.

## Goals / Non-Goals

**Goals:**

- Derive a page's headings as a pure, testable function that reuses the existing block-index rule, so a heading's target can't drift from search/marking.
- Locate a heading by reusing the existing locate path, with no document change and no new editor seam method.
- Merge References into Forwardlinks with the two row behaviors kept legible.
- Keep the typing path untouched: no per-keystroke derivation.

**Non-Goals:**

- List items or an outliner TOC (ADR-0027).
- Live-draft freshness (saved content only).
- Moving the caret or editing from Contents.
- A second Markdown parser or any new dependency.
- Changing the editor's locate mechanism (reused as-is).

## Decisions

### D1: A pure `deriveContents(markdown)` built on `blockStartLines`

`src/vault/contents.ts` exports `{ level: number; text: string; block: number }[]`. It computes `blockStartLines(markdown)`, and for each anchor whose line is an ATX heading (`/^#{1,6}\s/`) keeps a row: `level` from the `#`s, `text` the heading text, `block` the anchor's index.

Because `blockStartLines` skips fenced-code interiors, a `---`/`#` inside a fence is never a heading; because it only anchors block starts, a `#` on a continuation line is not one either. The `block` value is exactly the index `highlightBlock` expects.

Alternatives rejected: a second heading parser computing its own block numbers (drifts from search's indexing); reading the live ProseMirror document (that is the live-draft option, not chosen).

### D2: The rows are derived from saved content, memoized on the content string

`App`: `const contentsRows = useMemo(() => deriveContents(page?.content ?? ''), [page?.content])`. Keyed on the content string, it rebuilds only when the saved content changes — after auto-save — and never on a keystroke. This is the freshness the spec requires ("Contents is derived from saved content").

### D3: Contents is a content-sized band above Backlinks

`MetaPanel` gains a `contents` prop and renders a new `Accordion title="Contents"` **first**, open by default. Its body sizes to its content up to a maximum height and scrolls within itself; Backlinks and Forwardlinks keep the existing shared-height + floor pattern. Rows are `button`s labelled with the heading text and indented `(level - 1) * step` via `padding-left`.

### D4: Activating a row only sets `matchHighlight`

`App` passes `onLocate={(block) => setMatchHighlight((prev) => ({ block, nonce: (prev?.nonce ?? 0) + 1 }))}`. That is the whole handler. It reuses the search-marking locate path and does not touch the draft, the caret, or history.

Crucially it does **not** call `handleSelect(path, block)`: that would re-open the page, reset the draft baseline to the index content, and could drop unsaved edits. Reusing only the highlight state is what keeps the action view-only.

### D5: References becomes the Files group of Forwardlinks

`MetaPanel` renders one `Accordion title="Forwardlinks"` whose body holds a **Pages** group (`forwardlinkRows`, activate `onSelect`) and a **Files** group (`referenceRows`, activate `onOpenAsset`) — two `LinkList`s with their own captions, inside the one band. The separate References `Accordion` is removed. Row behavior is unchanged: a page row navigates, an asset/board row opens.

### D6: Defaults

Contents open, Backlinks open, Forwardlinks collapsed, Keyboard shortcuts collapsed. In `MetaPanel` terms: `defaultOpen` on Contents and Backlinks, absent on Forwardlinks and (as today) the shortcuts reference.

## Risks / Trade-offs

- [Heading ↔ block index drifts from the editor] → both use `blockStartLines`; search already depends on the same mapping. Test a page with a heading after a paragraph, a list, and a code fence.
- [A `#` inside a fenced code block is read as a heading] → `blockStartLines` skips fence interiors; test it.
- [Contents claims too much panel height] → it is content-sized with a cap and its own scroll, not a height-sharing band.
- [Locating accidentally re-opens the page and drops edits] → the handler only sets `matchHighlight`; test that an unsaved draft survives a Contents click.
- [The merge reverses `split-forwardlinks-and-band-meta-panel`] → recorded in the `ui-shell`, `vault-assets`, and `whiteboards` deltas; the two row behaviors are preserved as groups.
- [Spec delta drops scenarios] → every MODIFIED requirement keeps its existing scenario names, with bodies updated.

## Migration Plan

None. Contents is derived data, rebuilt from the page's content; nothing is stored and no file kind changes.
