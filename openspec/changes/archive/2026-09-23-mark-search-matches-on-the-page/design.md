## Context

See proposal.md — Why. The pieces involved:

- The index carries each page's raw Markdown as `SearchDoc.text`; Fuse matches are converted to `SearchResult` with `ranges` (offsets into that text). `firstMatchLine` shares the editor's `blockStartLines` rule to name a block-anchored line, and `MatchBody` renders it as `· line N`.
- Opening a result runs `handleSelect(path)`, which sets the active path and draft; `EditorPane` is keyed by path and reseeds a fresh editor. Its mount effect resets the pane's `scrollTop` to 0 on a path change. Nothing carries the match.
- `EditorAdapter` already owns all ProseMirror access; `getBlockLines` exists only for the rail's numbers. `gutter.ts` measures top-level blocks and fold items and writes numbers and arrows.
- Fold controls live in the rail's right column (move-list-folds-to-the-left-rail, split-the-left-rail-into-columns).

## Goals / Non-Goals

**Goals:**

- Carry the matched block from the index through selection into the editor.
- Scroll to and transiently mark that block, view-only and without an undo step.
- Remove the line-number rail and the `· line N` label, keeping the fold controls.

**Non-Goals:**

- Highlighting the exact matched characters (the search offsets are into raw Markdown, not the parsed document).
- Persisting or remembering a highlight.
- Marking matches from any entry point other than opening a search result.
- Any document, file, or index change.

## Decisions

### D1 — A result carries a top-level block index

`SearchResult` gains `block: number | null`: the index of the `blockStartLines` anchor at or above the first match, or null when there is no text match. `firstMatchLine` becomes `firstMatchBlock`. The block index is more robust than the line number: canonicalizing a page (soft-wrapped paragraphs) changes the line a block starts on but not which top-level block it is, and the editor's document children are those same blocks in order.

Alternative considered: send the raw text offsets and map them onto ProseMirror positions (rejected — the parsed document has no direct offset map from the raw Markdown; that mapping is the kind of work the app avoids elsewhere).

### D2 — Selection carries the block; App holds it with a nonce

`handleSelect(path, block?)` takes an optional block. Only the two search surfaces pass one; every other navigation clears it. App keeps `matchHighlight: { block: number; nonce: number } | null` and passes it to `EditorPane` when the path matches. The nonce lets opening the same result twice re-trigger the effect.

### D3 — The editor marks with a decoration, scrolls the block, and clears on a timer

A small `searchHighlight` plugin holds `{ block: number | null }`, adds a `Decoration.node` with class `folio-search-hit` over that top-level block, and returns to null on any `docChanged`. `EditorAdapter.highlightBlock(index | null)` sets or clears it, scrolls the block's DOM into view (`nodeDOM(from).scrollIntoView({ block: 'center' })`, guarded for jsdom), and schedules a clear after `HIGHLIGHT_MS` (~2s); the adapter cancels a pending timer on a new request and on destroy. The transaction carries no document change, so the highlight is not an undo step and never reaches the serializer.

Alternative considered: clear the mark purely in CSS with an animation and leave the decoration (rejected — a stale decoration would linger and could re-appear on a re-render; an explicit clear with a fading animation is honest).

### D4 — The rail loses its numbers

`gutter.ts` becomes `rail.ts` with `updateRailDom(host, folds)`, writing only fold controls; `measureNumbers`, the number spans, and `GUTTER_MARKER_HEIGHT` go. `numberOffset` stays, because the arrows still centre a 14px box on a line. The rail narrows to the control column and the document's left padding follows. `getBlockLines` leaves `EditorAdapter`, `MilkdownAdapter`, and `FakeEditor`; `lineAnchors.ts` stays, now used by search alone. The CSS class `.gutter`/`gutterNum` becomes the rail's control styles.

### D5 — MatchBody drops the label

`MatchBody` removes the `firstMatchLine` call and the `· line N` span; the label and the highlighted snippet stay.

### D6 — The highlight is a view operation

Marking dispatches a meta-only transaction (a decoration change), so it cannot dirty the page, cannot create an undo entry, and cannot be serialized. The `docChanged` clear means an edit removes it for free.

## Risks / Trade-offs

- [The index's content can be stale against an open draft, so the block index may point at the wrong block or past the end] → The adapter treats an out-of-range index as "nothing to mark"; a stale highlight is a cosmetic miss, and this staleness already existed for the line label.
- [The top-level block holding a match inside a list is the whole list, so the wash covers the list] → Accepted: the mark is a locator for the reader, not a precise character highlight; the matched snippet in the result still shows the exact text.
- [A highlight applied before the document settles (mount, images) can scroll to the wrong place] → Apply only after `setContent` resolves, gate the same-page effect on a ready flag, and re-measure is unnecessary because the mark is a decoration, not layout.
- [jsdom has no `scrollIntoView`] → Guard the call; tests assert the decoration and the requested block, not the scroll.
- [Removing `getBlockLines` touches the seam, the fake, and the pane tests] → Part of the change; the rail tests assert controls only.

## Migration Plan

None. Nothing is stored; revert the commit to roll back.
