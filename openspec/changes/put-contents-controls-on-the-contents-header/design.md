# Design

## Context

See proposal.md — Why. The two controls already exist with their handlers and
their view-only terms; what changes is who owns the row they sit in. `Accordion`
already renders an `actions` slot at the summary's trailing edge, ahead of the
disclosure marker, and cancels the summary's default toggle for a click inside it
(put-nav-controls-on-the-journal-header). The Journal row is the working model.

The catch is where the controls live today: inside `ContentList`, which is the
body. The body is unmounted content when the section is collapsed, and the
controls are only correct while `tree.length > 0`, `pageOpen`, and not loading.
Both conditions have to move up to `MetaPanel`, which owns the accordion.

## Goals / Non-Goals

**Goals:**

- The Contents summary carries the two controls, in order, at every width and in
  both open and collapsed states.
- The row stays one line tall, the same as the Links and Referenced-by summaries.
- A click on a control does its own job and never toggles the section.
- No new work on the keystroke path.

**Non-Goals:**

- Changing `Accordion`, which already has the slot and the toggle cancellation.
- Changing what the controls do, their names, or their order.
- Changing the rows, the tree, or the collapse-state lifetime.

## Decisions

### D1. The controls move into the Contents accordion's `actions` slot

`MetaPanel` builds the two buttons and passes them as `actions` on the Contents
`Accordion`, which draws them after the title and before the disclosure marker.
`ContentList` loses `onExpandAll` / `onCollapseAll` and the sticky row, and goes
back to being rows and nothing else.

- **Why the summary and not a header band above it?** The request is that the
  controls belong to the accordion item. A band above the summary is the row that
  was just removed (the sticky `.contentTools` line), and a band below it still
  costs a line of the panel's height.
- **Why not absolutely position them over the summary?** The row's height, the
  marker's slot, and the hit targets would have to be coordinated by eye; a flex
  child is the same result with no magic numbers.

### D2. The visibility rule moves up with the controls

The controls render on the summary only while the page is open, the index is not
loading, and the tree has at least one heading — the same three terms that put
them in the body before. `MetaPanel` already computes `tree` (memoized on
`contents`) and already knows `loading` and `pageOpen`, so the decision is three
cheap reads per render, not a walk.

Side effect, and the point of the change: collapsing Contents no longer hides
them, because a summary renders in every state. The old sticky line existed
because a long outline scrolls inside a capped body and the controls had to stay
reachable; on the summary they are always reachable, so the stickiness and its
background go with it.

### D3. The controls are the summary's own text at the summary's own size

They are text buttons in the row's small sentence case and stone colour, not the
uppercase section label, because they are controls and not a section name — the
same reasoning as the Today label on the Journal row. Nothing about their box
grows the row: `Accordion`'s `.actions` wrapper already holds the group at the
label's height with negative block margins, so a pair of text buttons costs no
padding.

- **Why full labels and not glyphs?** Two abstract arrows next to "CONTENTS" would
  not say "all". The labels are short enough that at the panel's 280px the title
  still fits; on a window narrow enough to squeeze it, the title ellipsizes first,
  as it already does for Journal.

### D4. No copy change

The tour's right-panel step explains what Contents and Links hold; it does not
name the two controls, so nothing there is now wrong. `DESIGN.md` has no rule
about them.

## Risks / Trade-offs

- **Two more buttons inside a `<summary>`** → the slot's wrapper cancels the
  click's default action, and the component test asserts that activating a
  control leaves the section open. The Journal row already proves the pattern in
  a browser check.
- **The summary gets crowded on a narrow panel** → the title takes the leftover
  width and ellipsizes; the controls keep their size and never wrap, because the
  wrapper is `flex: 0 0 auto`.
- **Labels in the summary read like section names** → they are sentence case and
  stone, and the row's marker still sits at the far edge, so the label stays the
  only uppercase text in the row.
