# Tasks

## 1. The block's extent

- [x] 1.1 Add a pure helper beside `blockStartLines` in `src/lineAnchors.ts` that answers a block's line range from the same rule: start line through the line before the next anchor, without trailing blank lines. Unit-test it beside the existing rule's cases: a single-line block, a wrapped paragraph, a multi-line list, a fence, the last block in the document, a block followed by blank lines, and an index the document does not hold.
- [x] 1.2 Have the adapter resolve a block index to that range instead of to its start line.

## 2. The frame

- [x] 2.1 Replace the `Decoration.line` mark with per-line decorations across the range, carrying an edge role per line: first, middle, last.
- [x] 2.2 Draw the frame in the stylesheet with inset `box-shadow` edges so nothing moves: top on the first line, bottom on the last, sides on every line, radius on the corners. `src/components/locatedBlockFrame.test.ts` asserts it and fails if any of those selectors ever sets a border, padding, or margin, which is what keeps a long wrapped line from re-wrapping. Whether the sides join without a visible seam is a visual judgement, left to a later look (design: Risks).
- [x] 2.3 Use `--brand` at 1px. Its weight beside a blockquote's left bar and a table's grid is a visual judgement, left to a later look (design: Risks): the token or the thickness is a one-line change if it reads as a control.
- [x] 2.4 Remove the fill rule and the `searchHitFade` keyframes, and correct the stylesheet comment that names `HIGHLIGHT_MS` in the deleted `src/editor/searchHighlight.ts`.

## 3. Persistence

- [x] 3.1 Hold the frame as mapped positions and remove the two-second timer, so a document change moves the frame with its text instead of clearing it. Delete the now-unused `HIGHLIGHT_MS`.
- [x] 3.2 Hold the locate in `App` as `{ path, block, nonce }`, pass it to the pane only when the open page is that path, and stop clearing it on a navigation that names no block.
- [x] 3.3 Confirm by hand that the frame is still there after leaving the page and returning, and after stepping back to it through page history.

## 4. Tests

- [x] 4.1 The extent: the frame covers every line of a multi-line block and neither neighbour.
- [x] 4.2 The frame moves nothing: the text's positions and wrapping are unchanged by the mark.
- [x] 4.3 The mark stays: it is still there after the interval that used to clear it, and after a keystroke inside and outside the block.
- [x] 4.4 Surviving a return: a locate on one page, a navigation away, and a navigation back leave the frame in place.
- [x] 4.5 Replacement and absence: a later locate frames only the new block, and a page opened without a locate is unmarked.
- [x] 4.6 The caret and the selection do not move, and the file is not written.
- [x] 4.7 Re-point the existing locate tests in `mount.test.tsx` and `EditorPane.test.tsx` that assert the old mark's shape or its timer.

## 5. Records

- [x] 5.1 Rewrite DESIGN.md's Search match section: a persistent 1px `--brand` frame around the located block, drawn without layout, replacing the fading `--brand-tint` wash. Fix its stale `HIGHLIGHT_MS` pointer while there.
- [x] 5.2 Bump `version` in `package.json`.
- [x] 5.3 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npx tsc -b`, `npm run build`, and the suite.
- [x] 5.4 Archive the change and sync its specs, then commit and publish.
