## Context

The editor-responsiveness budget in `AGENTS.md` asks every feature that touches the keystroke path to state what it adds and what that scales with. This change is the budget's first review of work that predates it, and it found two paths that do whole-document work:

- `src/editor/referenceBadges.ts` recomputes every badge in the document on every doc-changing transaction (`apply: (tr, value) => (tr.docChanged ? scan(tr.doc) : value)`), so the cost lands on every keystroke.
- `src/components/EditorPane.tsx` `updateGutter` walks every top-level block, reading layout and writing styles per block. ProseMirror does not type text on `keydown`; the transaction runs on the `input` event, and the gutter runs from the adapter's change listener, which Milkdown debounces by 200 ms, plus on every `ResizeObserver` reflow. So the gutter is per editing burst rather than per keystroke, but it is the far more expensive of the two.

Both are presentational: badges are decorations over literal text (ADR-0009) and the gutter is inert markup. Nothing about the reference model, the index, or Markdown changes here.

## Goals / Non-Goals

**Goals**

- Badge work per keystroke proportional to the blocks the edit touched, not to the document.
- Gutter updates linear in the block count, with a single layout pass per update.
- Byte-for-byte identical visible behavior: same badges, same numbers, same positions, same inertness.
- Both costs measured, with the harness recorded, as the budget requires.

**Non-Goals**

- No virtualization, windowing, or lazy rendering: every block still renders.
- No change to when the gutter updates or to the badge decoration model.
- No new dependency; no change to the editor/vault seam.
- Not the picker's candidate scan (measured and bounded in add-reference-autocomplete, design D2).

## Measurements (before)

Chromium via `playwright-cli`, against a folder backed by the Origin Private File System (`window.showDirectoryPicker` overridden to return it) and seeded with pages of 60, 300, and 1500 blocks. Three instruments, all injected rather than added to the app:

- `Element.prototype.getBoundingClientRect` and `Range.prototype.getClientRects` wrapped to count calls and accumulate time inside them. This is the instrument that attributes the gutter's cost, and it is exact: the gutter's read count is 2 x blocks + 1 every time.
- A typing burst measured end to end: `page.keyboard.type` of 53 characters, three times per page size, taking the median wall time, minus the same burst on a blank page. Each CDP round trip includes the page processing the event, so blocking work shows up in the wall time, and the blank page's burst is the baseline for CDP and ProseMirror overhead. An earlier version of this harness timed the `input` event to its first microtask instead; that raced ProseMirror's DOM observer (the transaction runs in a later microtask), so it reported 0.01 ms for work the burst measurement shows costs milliseconds. The burst is what a typist feels, so it is the number used here.
- A 900 ms pause after each burst, so the debounced gutter update is read separately from the keystroke path.

| blocks | keyboard burst for 53 chars | delta vs blank (per char) | gutter: layout reads | gutter: ms |
|---|---|---|---|---|
| 1 | 123 ms | — | 3 | 0.1 |
| 60 | 142 ms | +0.4 ms | 121 | 28.6 |
| 300 | 209 ms | +1.7 ms | 601 | 286 |
| 1500 | 568 ms | +8.3 ms | 3001 | **1490** |

The gutter's shape is the real finding, and it is where the change earns its keep. Its cost is quadratic, not linear: 5x the blocks (300 to 1500) costs 20x the time, against 25x for a perfect square. The cause is interleaving: `host.replaceChildren()` first, then per block a `getBoundingClientRect` read, a `range.getClientRects` read, then a `span.style.top` write and an append. Every write invalidates the layout the next block's read is about to force, so the update performs one full layout of the whole document per block. 1490 ms of blocked main thread after typing pauses in a long note, and the same again on every reflow.

The keyboard burst was taken as the keystroke metric, on the assumption that it would attribute the badge scan. It does not, and that assumption is the second finding. A 1500-block page with **no reference tokens at all** (no badges to compute) takes 548 ms for the same burst, against 485 ms for the same page with 75 badges: the badge path is not measurable in keystroke latency. What the badge scan actually costs is measurable in isolation instead: 0.21 ms at 100 blocks, 1.1 ms at 1000, and 6.3 ms at 5000 blocks for a full scan, all of it JS on the keystroke path.

Three further experiments placed the remaining keystroke cost outside the app's JS:

- A CPU profile of the burst at 1500 blocks accounts for about 100 ms of JS in total (of which the deferred gutter update is 34 ms), against 480 ms of wall time. The rest is renderer work that the profiler reports as native, not a JS frame.
- Frame gaps during the burst stay at 60 fps (median 16.5 ms) with three long frames totalling 111 ms, so the cost is not frame-bound rendering either.
- `content-visibility: auto` and `contain: layout paint` on the top-level blocks made the burst slightly worse (518 ms and 577 ms against 480 ms), so it is not per-block layout invalidation of the flow that a containment hint can cut.

The remaining document-proportional keystroke cost is therefore browser-side, in the renderer's non-frame main-thread work (style, layout, and accessibility-tree maintenance on a large contenteditable). It is out of this change's scope and is recorded rather than fixed; the change's goal for the badge path is scoping its JS, not the browser's work.

## Decisions

### D1 Badges: map the decoration set, rescan only the touched blocks

The plugin state keeps the `DecorationSet` and the reference list it already holds. On a doc-changing transaction:

1. `decorations.map(tr.mapping, tr.doc)` carries the surviving decorations forward.
2. Each step's `from`/`to` is expanded to the enclosing **top-level block** range, and the ranges are merged. Expanding to blocks rather than using the step range is what makes structural edits safe: a split or a join changes the text nodes on both sides of the boundary, and a reference can move between blocks.
3. For each affected block, the old decorations are removed (`set.find(from, to)` then `set.remove(...)`) and the block is rescanned, exactly as the current scan does but over one block's text nodes.
4. The reference list is mapped through `tr.mapping`, refs overlapping the affected ranges are dropped, and the rescanned ones are appended. Hit-testing keeps its current semantics, including a caret at the end of a token (`pos >= ref.from && pos <= ref.to`).

The scan stays the same pure function over a block's text nodes, or over one range of whole blocks, so `REF` remains the single tokenizer the index and the editor share.

What this buys, stated plainly: the badge scan stops scaling with the page (a full scan is 4.3 ms at 5000 blocks and 0.82 ms at 1000; a ranged scan of one block is 0.025 ms and 0.009 ms), so the keystroke path no longer carries a document-proportional JS pass. It does **not** make typing in a long page noticeably faster, because the dominant keystroke cost is browser-side work this change leaves alone (see Measurements). The requirement is about the badge work, and the badge work is what changed.

Alternatives rejected: caching ranges by text string (still walks every block to rebuild the set, and caches are a second source of truth); a `text.includes('#')` pre-filter (a cheap constant-factor win that does not remove the O(document) walk, so it would mask the problem rather than fix it); debouncing the rescan (decorations must be correct in the frame that renders the edit).

### D2 Gutter: one measurement pass, then one write pass

`updateGutter` splits in two:

- **Measure**: `host.getBoundingClientRect()` once, then for each block its `getBoundingClientRect()`, plus the first text node's `getClientRects()[0]` for prose blocks. All reads, no writes, so one layout computation serves all of them.
- **Write**: build the numbered spans into a `DocumentFragment` and insert them once, setting `top` before insertion.

The per-block geometry (a code block pins its number to the panel's top edge, prose centres it on the first text line, an empty block falls back to the block box) moves into a pure function of `(blockRect, lineRect, isCode, hostTop, markerHeight)`, unit-testable without a browser. Extracting it is a behaviour-preserving step taken before the optimisation so that the geometry is pinned by tests when the read/write split happens.

`getBlockLines()` still walks the serialized document once per update to derive the anchors. That walk is linear in the text, which is the floor for correct line numbers, and it is kept.

Measured after the change (same harness, same pages): the update performs one layout burst per update, and the pending target is that the 1500-block update drops from 1675 ms to the cost of a single layout plus a linear pass. The exact figure is recorded in D3's table when the tasks are done.

Alternatives rejected: rendering the numbers inside the blocks rather than in the left margin (cheap and measurement-free, but it changes the visual design and the marker's relationship to the block, and the gutter's current geometry is a shipped requirement); IntersectionObserver culling of off-screen blocks (machinery for a pass that becomes linear and cheap here); coalescing updates with `requestAnimationFrame` (does not remove the per-block interleaving, so the quadratic term stays).

### D3 What the budget gets

| path | before | after | scaling |
|---|---|---|---|
| badge scan | 0.82 ms per keystroke at 1000 blocks, 4.3 ms at 5000 | 0.009 ms at 1000, 0.025 ms at 5000 (one edited block) | was O(document) per keystroke, now O(edited) |
| keystroke latency as a whole | 8.3 ms per character at 1500 blocks | unchanged: the badge scan was not the cost | browser-side, out of scope (Measurements) |
| gutter update | 286 ms at 300 blocks, 1490 ms at 1500 (a quieter earlier run measured 83 ms and 1675 ms) | 2.5 ms at 300 blocks, 8.1 ms at 1500, with the same 2 x blocks + 1 layout reads | was O(blocks x a layout of the whole document), now O(blocks) |

The badge path keeps one linear pass per keystroke over the data it must touch: the edited blocks, and the decoration set it maps. There is no longer a pass over the document.

These are wall-clock numbers on a shared machine, so a re-run under load moves every row together by up to about 1.5x (the same final run measured 179 ms blank and 770 ms at 1500 blocks, against 123 ms and 568 ms above, with the gutter at 23 ms per 1500-block update against 8 ms). The ratios between rows, and the fact that a row does not move, are what the numbers are for.

### D4 How this stays honest

Timing numbers depend on the machine, so they are a recorded baseline rather than a CI gate. Two non-timing guards hold the change in place:

- **Badge**: the incremental result is compared against a from-scratch scan after each edit in a randomized sequence (`buildReferenceState(doc)` as the reference implementation), and the scan is observable by injection, so a test asserts the exact block range scanned for a given edit. The cost claim is measured by that injection plus the isolated scan bench, not by the browser harness:

| blocks | full scan | scan of one block |
|---|---|---|
| 100 | 0.15 ms | 0.0017 ms |
| 1000 | 0.82 ms | 0.0087 ms |
| 5000 | 4.27 ms | 0.025 ms |

- **Gutter**: a test spies on `Element.prototype.getBoundingClientRect`, `Range.prototype.getClientRects`, span insertion, and `style.top` assignment, and asserts that every read happens before the first write in an update. This states the requirement from the spec ("never interleaving a layout read with a style write per block") as an ordering assertion, which is stable where a millisecond threshold is not.

## Risks / Trade-offs

- [The measurement corrected a wrong assumption] → the change was proposed on the belief that the badge scan dominated keystroke latency; a page with no badges disproved it and the record was corrected rather than the claim kept. The badge work is scoped and the gutter cost is gone; the remaining document-proportional keystroke cost is browser-side and named as such.
- [The remaining keystroke cost tempts a bigger follow-up] → containment hints were tried and made it worse, so the honest next step is profiling the renderer rather than guessing. Out of scope here; recorded in Measurements.
- [Incremental badge invalidation misses a case, so a badge goes stale] → affected ranges expand to whole top-level blocks, the randomized property test compares against the full scan, and the structural-edit scenarios (split next to a reference) are explicit.
- [The reference list drifts from the decoration set] → both are produced by the same rescan pass, both are mapped by the same transaction, and the property test covers hit-testing boundaries.
- [The gutter's geometry changes while it is being refactored] → the pure geometry function is extracted and tested against the current behaviour in its own task before the read/write split.
- [An optimisation that trades one cost for another, such as caching DOM nodes per block] → the pool of spans stays rebuilt per update in a fragment; the only structure that persists is the plugin's decoration set, which is already ProseMirror's own.
- [The measurement harness is throwaway and drifts] → D4's structural guards are the durable part; the harness recipe is recorded here so the numbers can be re-taken, and the numbers are dated with the commit that took them.
