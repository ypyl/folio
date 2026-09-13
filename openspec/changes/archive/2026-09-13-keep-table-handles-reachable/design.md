## Context

See `proposal.md` — Why. The facts that shape the approach, measured in Chrome:

- The table block's node view places the column handle with a floating `placement: 'top'` against the header cell, so the handle's bottom edge meets the cell's top edge and its box extends 18px above the table. `tableBlockConfig` exposes only `renderButton`; the placement is not configurable from Folio (ADR-0017).
- The pane is the scroll container (`overflow-y: auto`), and a scroll container clips at its padding box. The document's top padding is 4px, so a table that begins a page has its first row 4px below the pane's box and its handle 14px above it: pane top 64, handle 50–68, `elementFromPoint` at the handle's centre = `HEADER`.
- The first block's margin is deliberately zeroed: `.ProseMirror > :first-child { margin-top: 0 }`, whose comment says why (headings carry 24px, and a page's first block shares its start line with the outboard columns' content).
- With a 16px margin on a leading table block: table top 84, handle 66–84, `elementFromPoint` at the handle's centre = the handle, pressing it selects the column (2 cells) and opens its group. The gutter still centres the block's number on the table's first line, and a prose page is unchanged (`firstBlockOffset: 4`, `h1 margin-top: 0`).

## Goals / Non-Goals

**Goals:**

- Every column control of a table that begins a page works with the pointer.
- No other page's geometry changes, and nothing about the file changes.

**Non-Goals:**

- No change to the component's placement, no clamping of the handle, no chords (see the proposal for why each is out of scope here).
- No change to the pane's padding or to the shared start line.

## Decisions

### D1 Give the leading table room, rather than move the handle

The fix is one rule: a table block that is the document root's first child carries a 16px top margin, overriding the first-child margin reset for that one block type.

- **16px** is the smallest step on the 4px grid that fits an 18px handle plus clearance: measured, the handle lands at 66–84 with the pane's box starting at 64.
- **A margin, not padding**, because the gutter and the click-below geometry work from block boxes; the number is centred on the block's first text line, which moves with the block, so the gutter needs no change (verified).
- **Scoped to the first child** because any other table already has content above it, which is where its handle goes.

Rejected: **clamping the handle in Folio**. It covers this case and the scroll case, but it means observing and rewriting the component's inline placement, and when there is no room above a table with a 4px top padding the clamped handle has nowhere to go but over the first row's header text. That trade is not obviously better than one block type carrying a margin.

Rejected: **more top padding on the pane or the document**. The compact top padding and the shared start line are deliberate, and raising them moves every page's first line to fix an edge case.

Rejected: **chords for align and delete**. Worth doing, but it leaves the pointer affordance broken and does not answer the reported problem.

Rejected: **patching the component's placement or portalling the handle**. Folio adopts the component rather than owning it (ADR-0014, ADR-0017).

### D2 The rule is written beside the reset it overrides

The first-child margin reset and this exception live together, with the exception naming the handle as the reason, so a reader who sees one sees the other. DESIGN.md's Tables section records the same reason in the design language's terms.

### D3 A test pins the DOM shape the selector depends on

The rule keys on the table block being the editable root's first child: a shape that comes from Milkdown's DOM, not from Folio. A test asserts that a page beginning with a table has the block as the root's first child, and that a page beginning with a paragraph does not, so a wrapper change fails the suite rather than silently dropping the room.

## Risks / Trade-offs

- [A leading table starts 16px lower than a leading paragraph] → Intended and stated in the spec: it is the one block type that needs room for a control that hangs above it. Nothing else moves.
- [Milkdown or the component changes its DOM shape] → The test in D3 fails first; the rule would then need a new selector.
- [A table scrolled to the pane's top edge still clips its handle] → Named in the proposal as a non-goal with a workaround (scroll a little), and the alternative (clamping) is recorded in D1.
- [The margin is inherited by a table that is the first child of something else] → The selector is the editable root's direct child only, so a table nested in a list or a blockquote is untouched.

## Migration Plan

None. No file, storage, or index change. A page that is only opened is not rewritten, and the room is in the stylesheet.
