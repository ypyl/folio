# Design

## Context

See proposal.md — Why. Two code paths feed one number: `useVault` counts files
when a folder is restored or activated, and `App` prefers `graph.pages.size` once
the index is ready. The index's note rule already exists (`isPagePath`: a `.md`
file under `pages/` or `journals/`, at any depth, excluding hidden segments and
date-named files under `pages/`). The status bar renders its vault group only
when the folder name and the count are both present, so whatever is chosen has to
keep both present to avoid the group flickering.

## Goals / Non-Goals

**Goals:**

- One meaning for the number: the notes the folder holds, as the index counts
  them.
- The same number before and after the index lands, without an empty vault group
  while the app opens.

**Non-Goals:**

- Counting what the index does not index. See proposal.md — Non-goals.

## Decisions

### D1: Count with the index's own rule, in the pre-index path

`useVault`'s count becomes `(await storage.list('')).filter(isPagePath).length`,
the same predicate `buildIndex` filters with. Both paths then answer the same
question from the same definition, so they agree by construction rather than by
two implementations happening to match.

- *Alternative — hide the number until the index lands*: rejected. It ends the
  jump but leaves the vault group empty for the whole open, then grows a number;
  the count is exactly what tells a person their notes are there while the index
  builds.
- *Alternative — make the post-index number count every file*: rejected. The
  index holds note text, not asset or board bytes; counting every file would mean
  walking the folder again after indexing, and the number people care about is
  their notes.
- The one residual difference is a note the index skips because its read failed.
  The count then drops by one when the index lands, which is the index telling
  the truth about a file it could not read.

### D2: Rename the field, so the next reader cannot re-break it

`fileCount` invited exactly this bug: a name that says files, filled from a file
listing on one path and from the page index on the other. The folder record's
field, the status bar's prop, and the tooltip all say notes now. No stored data
changes: the folder's persisted record is `{ id, name, handle }`, so nothing
needs migrating.

### D3: Keep the vault group's render gate as it is

The group renders when the name and the count are both present, and `useVault`
now always fills the count for a granted folder at restore, as it did before. So
the gate never flickers for the case this change is about, and no new empty state
is introduced.

## Risks / Trade-offs

- **A folder whose notes live outside `pages/` and `journals/` now counts zero**,
  where before the pre-index number counted them and the post-index number did
  not → Mitigation: that is the index's existing scope, and the app writes notes
  only into those two folders; showing a number the index does not back was the
  bug.
- **The tooltip word changes** from `files` to `notes` → Mitigation: the vault
  test and the spec scenario move with it, and the spec requirement names the
  count for what it is.
