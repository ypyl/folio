# Tasks

Note: `AGENTS.md` bumps `version` in `package.json` on every commit — a minor bump
for this change (the panel's visible content changes), and its GitHub Release is
published at the feature commit after the archive is pushed.

## 1. The changelog file

- [x] 1.1 Read commit hashes in `scripts/changelog.mjs` (`%H%x09%ad%x09%s`), keep
  the newest 40 `feat:`/`fix:` entries, and resolve each kept commit's version
  with `git show <sha>:package.json`. Fail with the short hash when a user-facing
  commit has no readable version.
- [x] 1.2 Write `## v<version> (<date>)` headings, grouping consecutive entries
  with the same version; update the header text to say the file is grouped by
  version. Regenerate `CHANGELOG.md` and confirm the newest groups are 0.92.2,
  0.92.0, 0.91.0, and so on.

## 2. The app

- [x] 2.1 Change `src/changelog.ts` to `ChangeGroup[]`
  (`{ version, date, texts }`), parse the version heading, drop a heading with no
  bullets, and cap `recentChanges` at 20 change texts without splitting a group.
- [x] 2.2 Render the groups in `StatusBar`'s version-badge panel: one group
  heading per version with its `<time>`, the changes in a nested list, and no
  per-entry date. Update `StatusBar.module.css` for the heading and the grouped
  spacing, and update the DESIGN.md section that currently says there are no
  version headings.
- [x] 2.3 Keep the panel's footprint, scroll region, dismissal behavior, and
  absence of controls exactly as they are.

## 3. Tests and docs

- [x] 3.1 Rewrite `src/changelog.test.ts` for the grouped model: version
  headings, malformed input, empty groups, CRLF, the 20-text cap, and the
  committed file's newest-first groups with valid versions and dates.
- [x] 3.2 Update `src/components/StatusBar.test.tsx` and
  `tests/e2e/workspace.spec.ts` to assert each group shows its version and date
  and its changes sit under it.
- [x] 3.3 Update `README.md` only if it describes the panel; otherwise leave the
  changelog documentation to the file's header and DESIGN.md.

## 4. The circle

- [x] 4.1 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint
  --deny-warnings --format=agent`, `tsc -b`, `npm test`, `npm run build`, and
  `npm run test:e2e`.
- [x] 4.2 Commit the change with the minor version bump, archive it (syncing the
  workspace spec), bump the patch, push `master` to `origin` and `nas`, and
  publish the GitHub Release `v0.93.0` at the feature commit.
