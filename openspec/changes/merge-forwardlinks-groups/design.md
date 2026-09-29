## Context

See `proposal.md` for motivation. Current state:

- `MetaPanel.tsx` renders Forwardlinks as two `LinkList`s under the text labels
  "Pages" and "Files". `references` (files) and `forwardlinks` (pages) are
  separate props; the Files list is passed `activePath=null` and `onOpenAsset`
  as its activator, the Pages list `activePath` and `onSelect`.
- `LinkRow` is `{ title, path, materialized }`. `App` builds `backlinkRows`,
  `boardReferrerRows`, `forwardlinkRows` (pages), and `referenceRows` (files).
- `.groups` and `.groupLabel` in `MetaPanel.module.css` style the two labels.
- The sidebar now renders one badged listing; its badge is a leading
  non-interactive span before the label.

## Goals / Non-Goals

**Goals:**

- One Forwardlinks list, order preserved, each file row badged by kind.
- Share one row component across every panel list.

**Non-Goals:**

- Changing Backlinks or the board Referenced-by list, which are page-only.
- Changing row activation, ordering, or which rows exist.
- Touching the sidebar.

## Decisions

### D1: Order is pages, then assets, then boards

The two groups already rendered pages in document order and files as assets
first and boards after. The merged list concatenates the same two arrays, so no
existing ordering changes.

Alternative — interleave all references in document order — rejected: it changes
what the panel shows in a way this change has no reason to, and the previous
grouping had already dropped interleaving.

### D2: A `kind` on the row, and the sidebar's badge

`LinkRow` gains `kind: 'page' | 'board' | 'asset'`. The row renders a leading
badge for a board (`b`) or an asset (`a`) and none for a page — the same
treatment and style as the sidebar, so "what kind is this row" reads the same on
both sides of the shell.

### D3: One `LinkList` dispatches activation by kind

`LinkList` takes `onSelect` and `onOpenAsset` and calls the one the row's kind
names: a page row navigates, a file row opens its target. The two group-specific
lists collapse into one call.

### D4: Dimming follows the row, not the list

An unmaterialized row dims unless it is an asset: pages and boards can be
unmaterialized, an asset row exists only for a file the vault holds. This
replaces the per-list `dim` flag with one rule.

### D5: One empty state

The two per-group copies collapse to one, shown only when the merged list has no
rows. An open page that references only pages has no file rows but is not empty,
so it shows no copy.

## Risks / Trade-offs

- **Loss of the Pages/Files labels** → The badge carries kind and the row's click
  carries behavior; the labels were a second way to say what the badge says. If
  it reads worse in practice, a badge plus a hairline divider is the cheap fix.
- **Backlinks gains no visible badge** → It is page-only, so there is nothing to
  mark. It shares the row component; no dead branch is added for a case that
  cannot occur.
- **A fresh merged array each render** → `MetaPanel` is not memoized, so this is
  not a keystroke-path cost; the row arrays themselves stay memoized in `App`.

## Migration Plan

UI-only; no persisted state, no storage change. Tests that assert the two group
labels are updated to assert the single badged list.
