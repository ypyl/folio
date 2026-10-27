# Design

## Context

See proposal.md - Why. The Contents tree and its per-page collapse state already
exist in `MetaPanel.tsx`: `tree` is memoized on the rows App derives from the
page's saved content, and `collapse` is a `{ path, blocks }` pair whose `blocks`
is the set of `block` indices whose subtree is hidden. A row hides its children
when its own block is in that set. Nothing about the tree, the rows, or the
editor is new here; the change adds a way to write that set in one go.

## Goals / Non-Goals

**Goals:**
- One click to show the whole outline, one click to leave only its top level.
- Zero cost on the typing path: no new work per keystroke, per save, or per
  render beyond a memo that follows the tree's identity.

**Non-Goals:**
- No change to the tree shape, the disclosure controls, or the locate path.
- No persisted collapse state, no collapse depth, no shortcut.

## Decisions

**The controls live in a toolbar at the top of the Contents body.** The
`<summary>` is rendered by the shared `Accordion` and clicking anywhere in it
toggles the section, so controls placed there would fight the disclosure it
already carries. A toolbar inside the body sits with the rows it acts on and
keeps `Accordion` unchanged. It is sticky at the body's top edge, because a long
outline scrolls inside a 40vh body and the controls must stay reachable.

**Collapse-all writes the set of headings that have a subtree; expand-all writes
the empty set.** The collapse state is "which subtrees are hidden", so the two
operations are the two extremes of that set, not a second mode flag. Collapsing
therefore requires knowing which blocks have children: one pure helper over the
already-built tree (`collectCollapsibleBlocks`), memoized on `tree`, so it is
rebuilt when the page's headings change and never per keystroke. Expand-all
needs no derived data at all.

**The controls render only with rows.** Placed inside the tree's list component,
they inherit its empty-state branch, so a page with no headings, a closed page,
and the loading placeholder offer nothing to click. Both controls stay enabled:
Collapse all on a tree of leaves is a no-op, and a disabled state would need a
second derived value to say so for no gain.

**No new state, no new props.** Both handlers act on the existing `setCollapse`,
keyed by `activePath`, so the per-page reset and the session scope are inherited
rather than reimplemented.

## Risks / Trade-offs

- [A sticky toolbar costs a little vertical space in a capped body] → one 24px
  row, on the same surface as the panel, no shadow (DESIGN.md surfaces rule).
- [Two more buttons in a panel that also has section toggles] → both are quiet
  text buttons in `--stone`, subordinate to the rows; the section's own
  disclosure stays the only control in the summary.
- [Collapse all on a very large outline builds one set of every parent block] →
  one `Set` of integers per click, over a tree that is already in memory; no
  re-parse and no disk read, so the cost scales with heading count, not vault
  size, and it happens only on click.
