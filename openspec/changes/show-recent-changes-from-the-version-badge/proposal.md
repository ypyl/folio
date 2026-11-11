# Proposal

## Why

The version badge names the running build but says nothing about it, so a user
who sees `v0.87.0` has no way to learn what changed since the build they last
ran. The changes themselves are already written down — every shipped change has
a conventional-commit subject — but that record lives only in git history,
where a user of the app never looks.

## What Changes

- **The version badge becomes a control.** `v<version>` in the status bar's
  trailing edge opens a popover above the bar listing the newest user-facing
  changes, newest first, each with the date it landed. It is a disclosure, not a
  dialog: activating the badge again, clicking anywhere else, or pressing
  `Escape` closes it, and focus never leaves the badge. Where the badge is
  absent (surface below the compact breakpoint) there is no control either.
- **A changelog is a repo artifact, not a hand-copied list.** A new script,
  `npm run changelog`, regenerates `CHANGELOG.md` at the repo root from
  `git log`, keeping commits whose subject starts `feat:` or `fix:` and
  stripping the prefix. The file is committed; the build imports it as text and
  the app parses it, so the published bundle never needs git.
- **The badge's popover reads that file.** One module parses `CHANGELOG.md` into
  entries and caps what the popover shows; the badge itself, its place, its
  styling, and its "non-compact only" rule stay as they are.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace`: the status bar's trailing version is no longer "non-interactive
  text" — it is the bar's one display-only-area control, and activating it
  discloses the running build's recent changes in a floating panel while the
  recency list comes from the bundled changelog. The requirement gains the
  disclosure's contents, its dismissals, and its absence on compact, and the
  "The bar performs no actions" rule stays scoped to the other groups.

## Non-goals

- No per-entry version headings, no breaking-change badge, and no release notes
  fetched from anywhere: entries are the commit subject and its date, flat and
  newest first. (Kami's changelog template and its `--breaking-bg` token stay
  unused here.)
- No update check, no "new version available" notice, no unread marker, no
  preference that remembers the last version seen. Reading it is the whole
  feature.
- No settings surface, no about panel, no changelog viewer anywhere else in the
  app, and nothing on the compact bar.
- No experimental gate. `AGENTS.md` asks new capabilities to ship behind
  `flag || switch`, but that mechanism retired with reminders
  (`release-the-session-trace`), and restoring `features.ts`, prerelease mode,
  and the rail control to hide a read-only text panel would cost more than the
  feature and would hide a "what's new" surface from the people it informs. The
  popover reads bundled text, writes nothing, and gains no state. This is a
  recorded exception, not a new precedent for stateful features.
- No change to how the version is bumped, and no change to the badge's text,
  position, colour, or hover/focus treatment.
- No backend, no network, no vault file: the changelog ships in the bundle.

## Impact

- `CHANGELOG.md` (new, root): the generated list the popover reads.
- `scripts/changelog.mjs` (new) and `package.json`'s `changelog` script.
- `src/changelog.ts` (new) and `src/changelog.test.ts`: the parser and its cap.
- `src/components/StatusBar.tsx` and `StatusBar.module.css`: the badge becomes a
  button and carries the popover.
- `src/components/StatusBar.test.tsx`: the badge's open/close/list scenarios.
- `tests/e2e/workspace.spec.ts`: the popover opens with entries and closes on
  `Escape`.
- `openspec/specs/workspace/spec.md` via this change's delta; `DESIGN.md` gains
  the popover's recipe; `AGENTS.md` gains the regenerate-the-changelog step in
  its version-bump rule; `README.md` mentions the badge as the in-app changelog.
- Version bump: minor for the feature commit (a new user-facing capability), a
  patch for the archive commit.
- ADRs: none changed. ADR-0006 (keep it small) holds — one bundled text file, no
  new dependency, no new storage; ADR-0001/0009 are untouched (nothing derived
  from the vault).
