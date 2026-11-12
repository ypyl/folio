# Design

## Context

See `proposal.md` for why. What shapes the approach:

- `scripts/changelog.mjs` walks `git log`, keeps `feat:`/`fix:` subjects, keeps
  the newest 40, and groups them by author date. It writes `CHANGELOG.md`, which
  is committed.
- `src/changelog.ts` imports that file as raw text, parses it once at module
  load, and exposes `recentChanges`, the newest 20 changes.
- `StatusBar`'s version badge renders `recentChanges` as a flat list of texts
  with a per-entry date. The panel is a fixed 300px slip with a 320px cap; the
  list inside it scrolls.
- Every commit in Folio's history bumps `version` in `package.json`; the first
  commit already has the file. A `feat:` or `fix:` commit therefore names the
  build that introduced its change.

## Goals / Non-Goals

**Goals**

- Each change belongs to a build, visible in the file and the panel.
- The newest-first order, the 20/40 caps, and the panel's footprint stay as they
  are.
- The parser keeps degrading on a malformed or hand-edited file instead of
  breaking the status bar.

**Non-Goals**

- No new UI surface, no version history page, no GitHub links, no filters.
- No change to what qualifies as an entry.
- No inference of a version for a commit that did not carry one.

## Decisions

### D1: The version group is the commit's own `package.json` version

The generator resolves each kept commit's version with
`git show <sha>:package.json`. It does not read the working tree: that file
carries the version of the commit being generated, which is the archive or docs
follow-up, not the change. It caches nothing because the list is 40 commits and
each is read once.

A missing or unparsable `package.json` at a user-facing commit throws with the
short hash and the file name. Falling back to a date-only heading would put a
change in the file with no build, which is the problem this change fixes; a
silent `0.0.0` would be a lie.

### D2: The file heading is `## v<version> (<date>)`

Examples:

```
## v0.92.2 (2026-11-12)

- give the installed icon opaque corners

## v0.92.0 (2026-11-11)

- move the Logseq import to a repo script
```

The version is the stable thing, so it leads. The date stays in parentheses
because it is the day the commit landed, and removing it would lose the only
ordering signal a reader has besides the sequence. The `v` is written once in
the file and stored without it in the model, matching the badge's `v<version>`
convention.

Consecutive commits with the same version form one group. That cannot happen
today, because every commit bumps the version, but the generator and the parser
both group by version rather than assuming one entry per heading. The group's
date is the date of its first (newest) entry.

### D3: The parser returns groups and the cap counts changes

`parseChangelog(text)` returns `ChangeGroup[]`, each `{ version, date, texts }`.
A heading opens a group; bullets below it join that group. Lines before the first
heading, prose, and malformed headings contribute nothing. A heading with no
bullets is dropped: it names no change.

`recentChanges` takes groups until it has 20 change texts, slicing a group only
when a group would cross the cap. The panel therefore shows whole versions, and
the file remains the thing that holds more.

### D4: The panel groups the list, the date moves to the group heading

The scroll container stays one outer `<ul>`; each group is an `<li>` holding a
small heading (`v<version>` at 12px, 600 `--near-black`; the date as a `<time>`
at 12px `--stone` on the same row) and an inner `<ul>` of change texts. The
change text keeps 13px `--dark-warm` and the brand marker; it no longer carries a
date of its own.

This keeps the list semantics and the panel's single scroll region while making
the version the thing the eye lands on. The heading is a `<p>`, not an `<hN>`:
the panel already has its own name (`Recent changes`) and should not inject a
second heading level into the status bar's tree.

### D5: The parse stays at module load

The panel opens on a slice already computed when the bundle loads, exactly as
today. Grouping adds one pass over 40 lines at build/import time, never a pass on
a keystroke or a panel open. Nothing here touches the editor's path.

### D6: Tests move to the grouped model

- Parser tests use version headings, malformed headings, and empty groups.
- The committed-file test asserts every group has a semver version and a valid
  date, its texts are non-empty and unprefixed, and the newest group comes first.
- `StatusBar` tests assert each group shows its version and date and that its
  changes sit under it.
- The e2e asserts the open panel shows a version with a date, newest first.

## Risks

- **A malformed regenerated file loses the panel.** The parser degrades to no
  groups, and the badge falls back to its plain label (existing behavior), so the
  app stays usable. The generator is the only writer and has a script-level test
  through the committed file.
- **40 `git show` calls slow generation.** On this repository they are tens of
  milliseconds each; `npm run changelog` is a manual, commit-time command, not a
  build step, so the cost is invisible to the app.
