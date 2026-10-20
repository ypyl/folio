# Proposal

## Why

Opening a reference to a page that does not exist yet opens a blank page at
`pages/<name>.md`, and nothing is written until the first save. The status bar
then shows that path, but its name is not the reveal control: there is no Files
row, so the crumb is inert text. A user who has just opened the page they want to
work on cannot get to it in the Files listing, and nothing on screen says why.

## What Changes

- **The status bar's page name is a control for every open page**, whether or not
  the page has a file yet. A journal day, a board, an asset, and no open item keep
  the inert text.
- **Revealing a page that has no file creates it first.** Activating the name
  writes the page exactly as the first save would - its current content, which is
  empty for a page just opened from a reference - and then reveals the new row.
  From then on the page is an ordinary page: a Files row, a search result, a
  linkable and favoritable target.
- **A page that already has a file keeps the current behavior**: reveal writes
  nothing and changes nothing but the view.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `workspace`: the status bar's page-name requirement extends to a page with no
  file, and its "revealing writes nothing" clause becomes "writes nothing for a
  page that already has a file".

## Non-goals

- No change to the Files listing: a row still exists only for a page backed by a
  file. A draft row for a page with no file would touch the listing, favorites,
  reminders, and search at once, for the same outcome a single write gives.
- No materialization on open. Merely following a reference to see whether a page
  exists still creates nothing; only an explicit reveal does.
- No reveal control for a journal day, a board, or an asset; their breadcrumbs
  stay inert.
- No change to what a reveal does for a page that has a file: no navigation, no
  content change, no listing reordering.

## Impact

- `src/App.tsx`: the reveal handler distinguishes "open page" (button offered)
  from "page has a Files row" (nothing to create); a page with no row is written
  first, and the reveal waits for the row to exist.
- `src/components/StatusBar.tsx`: the reveal prop's documentation; no structural
  change.
- Tests: the App reveal tests gain the new-page case (the file is written, the
  row appears, focus lands on it), and keep the "page with a file writes nothing"
  and journal/board/sidebar cases.
- Version bump: a minor bump (a page opened from a reference can now be put in
  the Files listing from the status bar).
