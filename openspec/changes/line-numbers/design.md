## Context

Folio is a local-first notes app: Markdown files are the database (ADR-0001), the editor is a WYSIWYG ProseMirror surface (ADR-0008/0009), and search is Fuse.js over the live index (currently showing snippets but no location). The code-block change (this repo, unarchived) added a CodeMirror code block with local 1..N line numbers. See proposal.md — Why. This design adds a quiet line-number gutter to the editor and teaches search to report a match's line, sharing one pure numbering rule.

## Goals / Non-Goals

**Goals:**
- Editor: one canonical start-line per top-level block, rendered as a small dimmed gutter number, live on edits, inert to input.
- Search: rows report `· line N` (first text match's block anchor) in dropdown and results view.
- Editor and search agree by construction — the same pure rule, no duplicated logic.
- Addresses match the file for anything Folio has written (canonical form).

**Non-Goals:**
- No scroll-to-match/jump on open; no per-list-item numbers; no seed-accurate anchoring of legacy wrapped files (documented caveat); no renumbering of CodeMirror's local gutter; no interactive numbers or navigation commands.

## Decisions

1. **Numbering rule: a line starts a block iff it is the first line or follows a blank line; fenced code interiors are skipped.** In the editor's canonical serialization (produced per change), every block is exactly one line with no soft wraps, so blocks and anchor lines are 1:1 — the rule needs no ProseMirror or remark machinery, just text. Search applies the same rule to file text; for canonicalized pages (everything Folio has saved) the numbers are identical. *Alternative considered*: remark-parser source positions at seed + incremental line-delta tracking — exact for legacy files too, but much more machinery for a rare case; rejected (canonical caveat accepted).

2. **A single pure module, `src/lineAnchors.ts`, exports `blockStartLines(text) -> number[]`.** Fence-aware (three-backtick lines toggle an interior state; interiors contribute nothing), counts blank lines, returns anchor line numbers in order. It is the only place the rule lives: the adapter derives per-block lines from the canonical text; search derives the match anchor from `item.text`. Consistency is a property test over representative texts. *Alternative considered*: separate implementations per side — rejected; consistency is the entire point.

3. **Gutter rendering is a sibling overlay inside the existing 48px left margin of `.document`**, not a new column: absolutely positioned spans at `left: 0`, right-aligned toward the prose, `pointer-events: none`, `aria-hidden="true"`. Numbers are glued to blocks by measuring each top-level child of `.ProseMirror` (children order == top-level block order; both sides of the zip come from the same doc) and baseline-aligning to the block's first text line. Recompute on: the pane's own `onChange` (already wired for the empty-hint), a `ResizeObserver` on the editor root (reflow on window resize / font), and mount. No scroll handling — the gutter rides the same scroll flow. *Alternative considered*: ProseMirror widget decorations or a plugin gutter — rejected (interferes with editing/selection semantics or doesn't exist in PM).

4. **One number per list, one outer number per code block.** Lists are single top-level blocks (each item is not an address; matches inside a list anchor to the list start). Code blocks keep their CodeMirror 1..N gutter; the outer gutter additionally shows the block's fence start line. Both number systems remain honest (outer = canonical file address; inner = code-local), matching how VS Code treats embedded code.

5. **Search rows: first text match only, `· line N`, title-only shows nothing.** The first match is what the user will seek; `item.ranges` is empty for title-only results, which yields no line. The dropdown and the full results view share one small render helper.

6. **Tokens: 12px `--stone`, normal weight, right-aligned, no border.** Numbers are metadata (the DESIGN "dates, metadata" level); no hairline or fill (DESIGN: subtractive decoration).

## Risks / Trade-offs

- **Canonical drift on legacy wrapped imports** → a file with soft-wrapped paragraphs (e.g. `sample/Welcome.md`, untouched) has more file lines than canonical lines; search (file) and gutter (canonical) differ by the wrap count until the page is saved, after which the file *is* canonical. Accepted and documented in the proposal; the pure rule keeps the drift predictable (canonical ≤ file).
- **Gutter updates must follow paint** → measurement uses layout data (`getBoundingClientRect`/`offsetTop`), so recompute after the transaction applies; batch via the existing change flow, rAF if it ever jank-reports. Note-sized docs (tens of blocks) make this cheap.
- **`ResizeObserver`/measurement in jsdom tests** → the smoke test stubs IntersectionObserver already; the gutter's measurement path is DOM-level, so unit tests target `blockStartLines` and the render logic with stubbed rects; jsdom lacks `ResizeObserver` — stub it (or guard) in the test file like the existing IO stub.
- **Zip-by-children-order fragility** → if a future node view ever renders a non-1:1 top-level DOM shape, numbers would misbind; guard by asserting child count == anchor count in dev and covering with the app-level smoke test.
- **Dropdown row overflow** on long page titles + `· line 9` → ellipsis already applied to the label span; verify with a long-title fixture during apply (cosmetic, deferrable).

## Migration Plan

Rollout is additive and reversible: the gutter is presentation only, and `lineAnchors` is a new pure module — removing the render and the search affordance restores today's UI with no data change. No migration.

## Open Questions

- Whether the header dropdown should truncate or drop `· line N` on very narrow widths. Cosmetic; decide during apply against a long-title fixture.