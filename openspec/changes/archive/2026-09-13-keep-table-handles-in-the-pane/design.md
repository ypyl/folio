## Context

See `proposal.md` — Why. The facts that shape the approach, measured in Chrome:

- The component places the row and column handles itself, in the block's coordinate space, by writing `style.top` and `style.left` from a floating placement: the column handle's bottom edge meets the first cell's top edge, so its 18px box sits above the row.
- The pane is the scroll container (`overflow-y: auto`) and clips at its padding box, so a handle above its top edge is unpressedable: at the pane's top edge the handle is at 50–68 with the pane's box starting at 64, and `elementFromPoint` at its centre returns the app header.
- The component does not reposition a handle until the pointer moves again, so a handle that was placed while the table had room travels with the content when the pane scrolls and ends up outside the box without any new placement.
- The pane's own box is what clips. A handle's viewport rect and the pane's viewport rect are both available at the moment the component writes the placement, so the correction is a difference between two rectangles.
- Only the row and column chips carry a control set. The line handles (`add_row`, `add_col`) appear during a drag, and the drag is driven by pointer coordinates, not by where its indicator sits.
- jsdom has no layout, so the DOM pass cannot be tested there; the repo's precedent for this is the gutter, whose geometry is pure and unit-tested while its DOM pass is verified in a browser.

## Goals / Non-Goals

**Goals:**

- Every row and column handle is pressable wherever its table is, without moving the page.
- A handle that fits is untouched, so nothing about the app's ordinary look changes.

**Non-Goals:**

- No change to the component's placement math, no movable content, no chords (see the proposal).

## Decisions

### D1 Nudge the handle, not the table

The handle's position is corrected by the smallest move that brings its box inside the pane's, with a 2px margin. The geometry is a pure function, `nudgeIntoPane(handleRect, paneRect, margin)`, tested without a browser.

Rejected: **moving the table** (more top room, or scroll adjustments). The user's scroll position and the page's geometry are not a control's to change, and `keep-table-handles-reachable` already did the one layout change this deserved (a table that begins a page).

Rejected: **hiding a handle that does not fit**. The control would be gone exactly when it is needed.

Rejected: **patching the component's placement** (ADR-0014, ADR-0017 adopt it rather than own it). Folio adjusts the result, and ADR-0017 records that.

### D2 Two triggers, one write that settles

The pass runs when the component writes a handle's inline placement (a mutation observer filtered to `style` on the two handle roles) and when the pane scrolls. Both lead to the same computation; the write it makes is itself observed and finds nothing left to do, so it settles in one extra pass rather than looping.

The scroll trigger is what covers a handle that was placed while the table had room: the component does not move it again until the pointer does. While a handle is shown and the pane scrolls, it docks at the edge instead of leaving the box, which keeps it pressable; the component hides it when the pointer leaves the table.

Rejected: **a scroll trigger that hides the handle** instead of docking it. It would fight the component for its own visibility attribute for no gain over docking.

Rejected: **running the pass on every pointer move of the document.** The component's own writes are the signal that something moved, and the observer reads exactly those.

### D3 Only the row and column chips

The pass touches `[data-role="row-drag-handle"]` and `[data-role="col-drag-handle"]`. The line handles guide a drag in progress, and the component reads their boxes for the drop indicator's offsets; nudging them could misalign what the user is dragging.

### D4 ADR-0017 records the exception

ADR-0017 says Folio adopts the component rather than owning it, and this change is the first time Folio adjusts what the component owns. A line in that ADR keeps the exception visible where the adoption is decided.

## Risks / Trade-offs

- [A docked handle overlaps the first row of its table] → Accepted: with the row at the pane's edge there is no room above it, the pane is already cutting that row, and an overlapping handle is still a working control while an unreachable one is not.
- [The component's markup changes] → The observer keys on the `data-role` values the browser checks already use; a rename would be caught by those checks and by the geometry tests staying green while the feature silently stops.
- [A write from the pass fights a write from the component] → The pass only writes when the box is outside the pane, so inside it never writes; outside, the component's next placement re-enters the same path and converges on the same value.
- [Scroll work] → A scroll event scans two elements and usually finds nothing to do; nothing here runs on the typing path.
