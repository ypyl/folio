# Proposal

## Why

The recent-changes panel and `CHANGELOG.md` group changes by the day they landed.
A date says when a change landed, not which build introduced it. Several versions
can land on one day, so the panel merges unrelated builds under a single heading,
and the version badge names a build whose changes cannot be found in the list.
A reader asking "which version added this?" cannot answer it from the panel.

The version already exists on every user-facing commit, because every commit
bumps `package.json`. Grouping by it costs nothing at build time and gives each
change a build to belong to.

## What Changes

- **`CHANGELOG.md` groups entries by version**, with the date beside it:
  `## v0.92.2 (2026-11-12)`. The version is the one the commit carried, read from
  that commit's `package.json`, not the working tree's current version. The file
  keeps its 40-entry cap.
- **The version badge's panel groups by version too.** Each group shows the
  version and the date its changes landed; each change keeps its text and drops
  the repeated per-entry date. The panel still shows the newest 20 changes and
  still scrolls inside its fixed height.
- **The parser models groups**, not a flat list of dated changes: a group holds a
  version, a date, and its change texts. A version that ever carries more than
  one user-facing commit keeps them under one heading.
- **The changelog generator reads each kept commit's version** with
  `git show <commit>:package.json` and fails loudly if a user-facing commit has
  none, rather than writing a version it cannot prove.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace`: the recent-changes panel lists changes grouped by the version that
  shipped them, each group showing its version and date, not a date per entry.

## Non-goals

- **No new changelog surface.** No full changelog view, no links to GitHub
  releases, no filters, no per-version pages.
- **No change to the 20-shown and 40-kept caps**, the panel's placement, its
  dismissal rules, or its controls (it still has none).
- **No retroactive version guessing.** The generator reads the version the commit
  actually carried; it does not infer one from dates or releases.
- **No change to what counts as a changelog entry**: `feat:` and `fix:` only.
- **No change to the release policy.** A release still tags the feature or fix
  commit that carries the version.

## Impact

- `scripts/changelog.mjs` reads commit hashes and their `package.json` versions,
  and writes version headings.
- `src/changelog.ts` parses version groups and exposes `recentChanges` as groups.
- `src/components/StatusBar.tsx` and `StatusBar.module.css` render the group
  heading and the change texts; `DESIGN.md` documents the group heading instead
  of saying there are none.
- `CHANGELOG.md` is regenerated, so the committed file changes shape but keeps
  the same entries.
- Unit, integration, and e2e tests move to the grouped model.
- Version takes a minor bump: the panel's visible content changes.
