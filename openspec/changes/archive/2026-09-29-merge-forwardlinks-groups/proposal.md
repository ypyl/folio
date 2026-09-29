## Why

Forwardlinks splits the open page's outgoing references into two labelled groups
— Pages and Files — to keep page rows and file rows legible. The sidebar just
unified its kind lists into one badged listing, so the panel's split is now the
heavier treatment of the same idea: a label block above a list instead of a
small per-row kind badge. One visual language for "what kind is this row" is
better than two.

## What Changes

- **Forwardlinks becomes one flat list.** The "Pages" and "Files" group labels
  are removed. Order is unchanged in effect: the page references the open page
  makes, in document order, then its assets in document order, then its boards
  in theirs.
- **Every row carries a kind badge**, the same one the sidebar uses: a board row
  a `b` before its label, an asset row an `a`; page rows carry none.
- **One empty state** replaces the two per-group copies: "This page links to
  nothing." shows only when the merged list has no rows.
- **Backlinks and the board Referenced-by list are unchanged.** They list pages
  only, so no badge ever shows there; they now share the same row component that
  knows about kinds.
- A link row gains a `kind` so the panel renders the badge and dispatches
  activation by kind: a page row navigates, a file row opens its target.

## Capabilities

### New Capabilities

None. This reshapes existing link-list behavior.

### Modified Capabilities

- `ui-shell`: the meta panel's Forwardlinks requirement describes one badged
  list instead of two labelled groups, and its scenarios follow.
- `static-navigation`: the link-rows requirement names Forwardlinks' single
  badged list instead of its Pages and Files groups.
- `vault-assets`: "A page's files are listed in the Forwardlinks Files group"
  becomes asset rows in the single Forwardlinks list, badged `a`.
- `whiteboards`: "A page's board references are listed in the Forwardlinks
  Files group" becomes board rows in that same list, badged `b`, after the
  assets.
- `page-editing`: one drag scenario's wording ("Forwardlinks Files group")
  becomes the Forwardlinks list.

## Non-goals

- No change to Backlinks' contents, ordering, or the board Referenced-by list:
  both are page-only, so neither gains a visible badge.
- No change to the sidebar or its badges.
- No change to which rows exist or what activating one does: a page row still
  navigates, a file row still opens its target, a board row still opens the
  board editor.
- No change to the row ordering rules beyond dropping the group split (pages
  first, then files, exactly as the two groups rendered).
- No new ADR: no architecture, storage, or persistence change.

## Impact

- `src/components/MetaPanel.tsx` and `MetaPanel.module.css`: `LinkRow` gains a
  `kind`; one `LinkList` renders pages and files together, with a per-row badge;
  the Pages/Files group markup is removed.
- `src/App.tsx`: rows carry their kind, and the page and file rows are supplied
  as one Forwardlinks list.
- Tests: `src/components/MetaPanel.test.tsx`, `src/App.test.tsx`.
- Specs: `ui-shell`, `static-navigation`, `vault-assets`, `whiteboards`,
  `page-editing`.
- No dependencies, no `VaultStorage` change, no index change.
