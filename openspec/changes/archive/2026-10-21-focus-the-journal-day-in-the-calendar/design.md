# Design

## Context

See proposal.md — Why. The pieces that shape the approach:

- `StatusBar` renders the file-name crumb as a button only when App passes
  `onRevealPage`, and App gates that on the open item being a page
  (`canRevealPage`); a journal day gets inert text (workspace spec, "The status
  bar's file name locates the open item in the navigation").
- The page reveal is already a two-step: `handleRevealPage` sets `pendingReveal`
  and, when the left pane is folded or the compact shell shows another view,
  returns after asking for the pane/view, so a `pendingReveal` effect runs the
  reveal after the commit that made the target focusable.
- `Sidebar.revealActive` is a pure view operation on the DOM: it opens the row's
  `<details>`, scrolls the row into view, and focuses it.
- The Journal calendar's shown month is component-local state, seeded from the
  open day and re-anchored only when the open day changes or the Today control
  bumps `todayTick`. Chevron browsing is meant to leave the view elsewhere.
- The calendar renders a fixed 42-cell grid keyed by date string, so a given
  date's cell exists in every month's grid, as an in-month or a dimmed cell.
- While a folder's index builds, the Journal section renders a skeleton instead
  of the calendar, so no day cell exists yet.

## Goals / Non-Goals

**Goals:**

- One control, one action, no new surface: locating a day should feel like the
  page reveal it sits beside, including the folded-pane and compact paths.
- The calendar keeps owning its shown month; the locate arrives as a request.
- Focus lands on the day's cell, not merely on the section.

**Non-Goals:**

- No second calendar state owner, no imperative handle on the calendar, and no
  change to the calendar's existing re-anchor rules.
- No dialog, toast, or announcement: the focus move and the month change are the
  visible result.
- No change to what a day cell does when activated, or to the page reveal.

## Decisions

### D1: The pending reveal becomes a pending locate, not a second mechanism

`pendingReveal` currently records "the reveal is waiting for the pane/view". A
journal day needs the identical wait. The ref becomes a small discriminated
pending action — the open item's kind plus, for a day, its date — and the effect
that already watches the fold and compact view dispatches to `revealActive` or to
the day locate. One deferral path, one place that knows about folded panes and
compact views.

Alternative rejected: a second pending ref and a second effect. Two mechanisms
that must stay in step with the same two fold conditions is exactly the kind of
duplication that drifts.

### D2: The locate travels as a prop, and the calendar applies it

App holds a locate request — the day's date and a counter that makes each
activation a new request — and passes it through Sidebar to `JournalCalendar`.
The calendar's effect sets the shown month to the request's month and focuses the
cell for the request's date.

The shown month is the calendar's own state; a prop request keeps that ownership
and needs no imperative handle on the pane. It also covers the indexing case for
free: while the skeleton renders, the calendar is not mounted, and it applies the
request when it mounts with it. The counter is what makes a second activation of
the same day act again, and what keeps the effect from re-focusing on unrelated
renders.

Alternative rejected: a `SidebarHandle.locateDay(date)` method. It would move the
month state out of the calendar (or keep a mirrored copy in Sidebar), and neither
the pane nor the sidebar has any use for the day's month otherwise.

### D3: The section opens in the sidebar, before the request is forwarded

A closed `<details>` renders nothing focusable, and a child's effect runs before
its parent's, so the calendar cannot rely on an open happening in the same commit
and then focus. `Sidebar` therefore opens the Journal `<details>` imperatively —
the same `closest('details')` move `revealActive` uses — and forwards the request
to the calendar on the following render, once the section is open. Two commits,
deterministic order, no timing assumptions.

Alternative rejected: making `Accordion` controlled. It would touch both sections'
open state and the state that survives a fold, for one open.

### D4: The cell carries its date, and focus survives the re-anchor

A day cell gets a `data-date` attribute, so the locate is one query for the
cell. Because the grid is keyed by date, the same element moves when the month
changes: the effect focuses the cell, the re-render keeps the node, and focus
stays on it — no second commit and no refocus timer. The integration test asserts
focus after the month change, so a future keying change that replaced the node
fails there instead of silently dropping the focus.

### D5: The crumb's name follows the target, not the file name

The crumb text stays the file name, like every other kind's crumb. Its accessible
name names the day as the calendar names it (the long date the day cell already
carries) and the action, so the control reads the same in the status bar as the
cell it moves to. The page crumb keeps its current "Reveal … in Files" name.

## Risks / Trade-offs

- [Locating moves keyboard focus out of the editor, mid-typing] → That is the
  requested behavior: the user asked to be taken to the day's cell, and the
  editor's draft is untouched, so returning to it loses nothing.
- [A journal day open while the index builds has no grid] → The request waits in
  the prop and the calendar applies it on mount; nothing is dropped.
- [Re-anchoring fights chevron browsing] → The calendar re-anchors only when a
  locate request arrives, which is an explicit "show me this day"; browsing stays
  the free form it is now.
- [Replacing the requirement drops scenarios if the archive reads half the
  delta] → The delta removes the old requirement with its reason and adds the
  replacement with every page scenario carried over, and the archive step
  verifies the main spec holds the new requirement with both the page and the
  day scenarios.
