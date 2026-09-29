## Context

See `proposal.md`. Current state:

- `MetaPanel.tsx` renders Backlinks and Forwardlinks as separate accordions, each
  a `LinkList`. `App` supplies `backlinkRows` and a merged `forwardlinkRows`
  (pages, then files).
- `LinkRow` is `{ kind: 'page' | 'board' | 'asset'; title; path; materialized }`.
  The row renders a badge for a board (`b`) or asset (`a`) and nothing for a
  page; activation dispatches on `kind`.
- `MetaPanel.module.css` has `.links` (bottom-aligning group), `.section`,
  `.badge`.

## Goals / Non-Goals

**Goals:**

- One Links section for the page's incoming and outgoing links, one scroll body.
- Every row badged: direction (`in`/`out`) or file kind (`a`/`b`).

**Non-Goals:**

- Changing which links exist, their order, or activation.
- Touching the sidebar.
- Changing the index or storage.

## Decisions

### D1: One `Links` section replaces both

One accordion, one `LinkList`, one scroll body, open by default (Backlinks was
open; its rows now lead the merged list). The `.links` bottom-align group now
holds one section.

Alternative — keep two sections and only badge — rejected: that is the state the
user rejected.

### D2: Order is backlinks, then forwardlink pages, then files

Backlinks keep their most-recently-edited order (path tiebreak); forwardlink
pages keep document order; assets then boards keep document order. Concatenating
the existing arrays preserves every row's order.

### D3: `badge` on the row; `kind` stays for activation

`LinkRow` gains `badge: 'in' | 'out' | 'a' | 'b'`. `kind` still decides what
activation does (page navigates, file opens), because `b` alone cannot tell a
board from a backlink. Badge is display; kind is behavior.

### D4: Board mode's Referenced by rows are badged `in`

They are backlinks to the board, so they carry the same `in` badge as page
backlinks. The section keeps its name and its own list.

### D5: One empty copy

"No links yet." shows only when the whole list has no rows.

## Risks / Trade-offs

- **A scenario name is now misleading.** The spec's scenario
  `References is collapsed by default` keeps its name (MODIFIED cannot rename a
  scenario) but now asserts the Links section is open by default. Cosmetic; the
  body is truthful.
- **`b` appears in two roles across the shell** (board row, and the sidebar's
  board badge) but is unambiguous here: `in`/`out` mark pages, `a`/`b` mark
  files.
- **Merged list is a fresh array each render** → `MetaPanel` is not memoized, so
  no keystroke-path cost; the source rows stay memoized in `App`.

## Migration Plan

UI-only; no persisted state. Tests asserting the two sections are updated to the
one Links section.
