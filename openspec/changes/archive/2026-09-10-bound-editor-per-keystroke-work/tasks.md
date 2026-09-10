## 1. Baseline

- [x] 1.1 Take the baseline with the harness in design.md (playwright-cli, an OPFS-backed folder, `getBoundingClientRect`/`getClientRects` wrapped to count and time, an `input` capture listener for the synchronous transaction, a typing burst then a pause) on 300- and 1500-block pages, and confirm the design's numbers within machine variation: about 1-3 ms per keystroke on the badge path, about 80 ms and 1.6 s in the gutter burst.
- [x] 1.2 Confirm the quadratic shape directly by taking one more size (60 or 750 blocks) and checking that the gutter's time grows about with the square of the block count, so the fix targets the interleaving rather than the constant.

## 2. Gutter: pin the geometry before changing it

- [x] 2.1 Extract the per-block geometry out of `updateGutter` into a pure function of the block rect, the first text line's rect (or its absence), whether the block is a code block, the host's top, and the marker height, returning the number's offset. Verify with unit tests covering prose (centred on the first text line), a code block (pinned to the panel's top edge), an empty block (the block box as the fallback), and a block whose text line is missing.
- [x] 2.2 Verify the extraction changed nothing observable: the existing editor-pane tests pass unchanged, and a browser check shows the same numbers in the same positions on a page with prose, a list, a fenced code block, and an empty page.

## 3. Gutter: one read pass, one write pass

- [x] 3.1 Split the update into a measurement pass (the host rect once, then each block's rect, then each prose block's first text line rect) and a write pass (a `DocumentFragment` of numbered spans, each with its `top` set before insertion, inserted once). Verify with the ordering test: spy on `Element.prototype.getBoundingClientRect`, `Range.prototype.getClientRects`, `Element.prototype.appendChild`/`append`, and the `style.top` setter, and assert every read happens before the first write in an update; assert it fails against the previous implementation.
- [x] 3.2 Re-take the gutter numbers for 300 and 1500 blocks with the harness and record them in design.md D3: expect one layout burst per update and a cost that grows linearly with the block count, down from 83 ms and 1675 ms.
- [x] 3.3 Confirm reflow behaviour is unchanged in the browser: resizing the pane, and switching to a page whose fonts are not yet loaded, both leave every number aligned with its block.

## 4. Badges: invalidate only what the edit touched

- [x] 4.1 Expand each transaction step's range to the enclosing top-level block range, merge overlapping ranges, and rescan only those blocks: map the existing decoration set through the transaction, remove the decorations found in the affected ranges, add the ones the rescan produces, and carry the reference list forward the same way (mapped, minus the affected, plus the rescanned). Verify with a test that injects the scan and asserts, for an edit in one paragraph of a many-block document, that only that paragraph's blocks were scanned.
- [x] 4.2 Verify the incremental result matches a from-scratch scan: a randomized sequence of edits (typing inside a reference, adding and removing a `#`, splitting a paragraph next to a reference, joining blocks, editing a code fence, deleting a block) after which the decoration set and the reference list equal `buildReferenceState(doc)` for the final document.
- [x] 4.3 Verify hit-testing is unchanged at the boundaries: a caret at the start, inside, and at the end of a token still activates it, and a reference whose block was edited is still activatable after the edit.
- [x] 4.4 Re-take the badge number for 1500 blocks with the harness and record it in design.md D3: expect the per-keystroke cost to stop tracking the block count, down from about 2.8 ms.
- [x] 4.5 Confirm in the browser that badges look and behave as before on a page with references in several blocks: styling, click-to-open, `Mod+Enter`, and no badge inside a code span or fenced block.

## 5. Finish

- [x] 5.1 Confirm the doc-side walk that remains is linear and stays that way: `getBlockLines`' pass over the serialized document and the badge walk over the edited blocks are each one pass per update, and no update walks the whole document on the keystroke path.
- [x] 5.2 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npx tsc -b`, and `npm test`, all clean, with the coverage thresholds met.
- [x] 5.3 Re-take the full harness run (badge keystroke cost and gutter burst at 300 and 1500 blocks) and put the finished table in design.md D3, so the change ships with its measurement as the budget requires.
