# Tasks

## 1. The search layer names every matching block

- [x] 1.1 Replace `firstMatchBlock(text, ranges)` with `matchBlocks(text, ranges): number[]`: the distinct blocks the ranges fall in, in document order, empty when there are no ranges. Keep one rule for both: the block-start rule the frames use.
- [x] 1.2 Change `SearchResult.block` to `blocks`, and update its readers: `SearchSpotlight`, `SearchResultsView`, and their tests.
- [x] 1.3 Unit-test `matchBlocks`: one block for a single match, several blocks in order for matches apart, one entry for two matches inside a block, and none for no ranges.

## 2. The seam carries a set

- [x] 2.1 `EditorAdapter.highlightBlock(index)` becomes `highlightBlocks(blocks: number[])`, empty clearing, and the adapter converts each index to its block's line range.
- [x] 2.2 `EditorPane` passes the set it is handed, and `App` holds `{ path, blocks, nonce }`, still applying it only on the page it belongs to. The Contents caller passes one block.
- [x] 2.3 Re-point the tests that assert the old single-block call, in `EditorPane.test.tsx`, `App.test.tsx`, and the adapter's own suite.

## 3. The mark holds a list

- [x] 3.1 The highlight field holds an array of ranges and maps each through a document change, so every frame stays with the text it marks.
- [x] 3.2 Draw one frame per range: the per-line decorations and their first/middle/last roles, for each range, rebuilt only when the array changes.
- [x] 3.3 The table's frame flag becomes "any located range overlaps this table".

## 4. Tests

- [x] 4.1 Every matching block is framed, the first match's block is the one scrolled to, and blocks with no match are not framed.
- [x] 4.2 Two matches inside one block frame it once.
- [x] 4.3 An edit keeps every frame, and each stays with its own text.
- [x] 4.4 A later locate replaces all of them; an empty request clears all of them.
- [x] 4.5 A table holding a match is framed on the table, alongside the text blocks.
- [x] 4.6 The caret, the selection, and the file are untouched by a multi-block locate.

## 5. Records

- [x] 5.1 DESIGN.md's Search match rule says every matching block is framed, with the first scrolled to.
- [x] 5.2 Bump `version` in `package.json`.
- [x] 5.3 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npx tsc -b`, `npm run build`, and the suite.
- [x] 5.4 Archive the change and sync its specs, then commit and publish.
