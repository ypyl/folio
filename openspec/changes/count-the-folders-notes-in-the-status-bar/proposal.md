# Proposal

## Why

The status bar's vault group shows a count beside the folder's name, and that
number changes as the app opens. On a reload the bar shows every file the folder
holds — notes, assets, boards, and the `.folio` state — because the pre-index
count is a raw directory listing. Once the index lands it shows the notes the
index holds. In a folder with four notes, two assets, a board, and its
`.folio/reminders.md`, the bar reads 8 and then 4: the number does not just
settle, it changes meaning. A number that means two different things is worse
than a number that appears late, and watching it drop looks like notes went
missing.

## What Changes

- **The count is the folder's notes, at every moment.** It is computed with the
  index's own rule for what a note is — a `.md` file under `pages/` or
  `journals/` — so the number the bar shows before the index lands is the number
  it shows after. Assets, boards, and `.folio` state are not counted, and neither
  are Markdown files outside those folders, which the index does not read.
- **The count is named for what it counts.** The vault text's tooltip reads
  `(N notes)` instead of `(N files)`, and the term follows through the code:
  the folder record's count is `noteCount`.
- **The bar still shows a count from the first paint.** Hiding it until the index
  lands would also end the jump, but it empties the vault group while the app
  opens and then grows a number. Counting notes keeps the count useful and
  stable.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `workspace`: the status bar requirement says the trailing edge carries "the
  active folder's name and file count". It now says what the count counts —
  the folder's notes — and a scenario pins that it is the same before and after
  the index lands. No other part of the requirement changes. No ADR change: this
  is how one number is computed and labelled, not an architecture decision.

## Non-goals

- No change to where the count sits, how it looks, or when the vault group
  renders. Only its value and its tooltip's word change.
- No count of assets, boards, or `.folio` state anywhere in the bar.
- No indexing change: the index's definition of a note is reused, not redefined,
  and it is not widened to root-level Markdown.
- No placeholder, skeleton, or em dash while the index builds.
- No change to the compact shell, which shows no vault group at all.

## Impact

- `src/vault/useVault.ts`: the folder record's `fileCount` becomes `noteCount`,
  computed from the same listing with the index's page rule. Three sites: boot
  restore, activating a granted folder, and opening a folder.
- `src/components/StatusBar.tsx`: the prop and its documentation follow, and the
  tooltip says `notes`.
- `src/App.tsx`: one prop name.
- Tests: the vault hook's fixtures use note paths, a new test pins the pre-index
  count to the index's own page count on a folder holding assets, a board, and
  `.folio` state, and the status bar's vault test follows the tooltip.
- Version bump: patch (one number means one thing).
