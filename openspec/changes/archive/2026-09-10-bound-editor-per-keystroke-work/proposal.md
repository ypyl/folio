## Why

The editor does work proportional to the whole open document every time the document changes, and the AGENTS.md editor-responsiveness budget now asks for that work to be scoped and measured. Two paths, measured in Chromium on a real vault (see design.md for the harness):

- **Reference badges**: the plugin rescans the entire document on every doc-changing transaction, so every keystroke carries a document-proportional JS pass. Measured in isolation: 0.82 ms at 1000 blocks and 4.3 ms at 5000. (Measuring the keystroke as a whole showed that this scan is not what dominates typing latency in a long page; the dominant cost is browser-side and is out of scope. The measurement corrected the assumption the change was proposed on, and design.md records both.)
- **Line-number gutter**: after typing pauses, the gutter lays out its numbers by interleaving layout reads with style writes, one block at a time. Each read forces a fresh layout of a document that is itself the size of the block count, so the cost is quadratic: **286 ms at 300 blocks and 1.5 seconds at 1500** (a quieter run measured 83 ms and 1675 ms), on the main thread, plus the same cost on every window resize. A long note visibly freezes when the user stops typing.

## What Changes

- Badge decorations are invalidated incrementally: the existing set is mapped through the transaction, and only the text blocks the edit actually touched are rescanned. A keystroke's badge work becomes proportional to the edited blocks, not to the document (4.3 ms at 5000 blocks becomes 0.025 ms).
- The gutter measures every block first and writes every number afterwards, so one forced layout serves all of them instead of one per block. The numbers, their positions, and their reflow behavior stay exactly as they are today (1.5 s becomes 8 ms at 1500 blocks).
- Both paths carry a measurement in the change's design: the current cost, the cost after the change, and the instrumentation used, per the editor-responsiveness budget in `AGENTS.md`. The measurements also record what this change does not fix: keystroke latency in a long page stays as it is, because the document-proportional cost that remains is browser-side (style, layout, and accessibility work on a large contenteditable), not app JS.
- The badge and gutter specs gain the constraint that their work is scoped to what changed (so a future change cannot reintroduce a whole-document rescan or a per-block layout thrash without contradicting a requirement).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-editing`: the "References render as clickable badges" requirement gains the invalidation-scope constraint; the "The editor shows block line numbers" requirement gains the constraint that numbering and positioning stay live without re-measuring the document block by block.

## Non-goals

- No visual change: same badge styling, same numbers, same positions, same pointer-events and a11y treatment.
- No change to the reference model, the token regex, the index, or resolution. What is badged stays exactly what the index counts (ADR-0012, ADR-0009).
- No virtualization or block windowing: every block still renders.
- No change to when the gutter updates (still on mount, on a landed edit, and on reflow) and no change to the debounced save or the editor's serialization path.
- No new dependency, and no change to the editor/vault seam (ADR-0010).
- Not the picker's own candidate scan, which was measured and bounded when it shipped (add-reference-autocomplete, design D2).

## Impact

- `src/editor/referenceBadges.ts`: the plugin's `apply` maps decorations and rescans only the touched blocks.
- `src/components/EditorPane.tsx`: the gutter update splits into a measurement pass and a write pass; the block/anchor pairing it relies on (`src/lineAnchors.ts`) is unchanged.
- Tests: badge invalidation cases (edits inside a reference, across a block boundary, in an untouched block) and a gutter update that performs one layout read burst per update; plus the measurement harness documented in the design.
- Architecture: relates to ADR-0009 (Markdown stays canonical, so badges remain presentational decorations with no node of their own) and to the editor-responsiveness budget in `AGENTS.md`. No new ADR: this removes work inside existing layers rather than moving a boundary.
