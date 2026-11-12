# Proposal

## Why

Folio ships no telemetry, so the only way a bug or a wish reaches the project is
a user opening the repository themselves. The app mentions the issue tracker once,
at the bottom of the brand screen (`add-issue-report-note`), which is a surface a
user leaves on their first day. There is no reachable way to report anything from
inside a working session, and the repository has no issue template, so a report
arrives with whatever the reporter felt like writing.

## What Changes

- **The rail gains a feedback control.** A speech-bubble control in the rail's
  bottom group, directly above the tour control, opens the project's new-issue
  page in a new browser tab. It is present in every app state (no folder,
  restoring, demo, real folder) and in both compositions, because the rail
  renders in both, and it writes nothing anywhere. The tour control keeps its
  place as the rail's last control.
- **The repository gains issue templates.** `.github/ISSUE_TEMPLATE/` gets a bug
  report form, a feature request form, and a config that turns blank issues off,
  so a report arrives with the facts that are otherwise a round trip: what
  happened, how to reproduce it, the build, and the browser. The feedback control
  opens the chooser (`/issues/new/choose`), so the reporting user picks the form
  they need.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace`: the rail requirement gains the feedback control in its bottom
  group; the control's destination, its new-tab behavior, its presence in every
  state and composition, and its accessible name are specified.

## Impact

- `.github/ISSUE_TEMPLATE/bug_report.yml`, `.github/ISSUE_TEMPLATE/feature_request.yml`,
  `.github/ISSUE_TEMPLATE/config.yml` (new): the templates and the chooser's
  config.
- `src/components/FolderRail.tsx` and `FolderRail.module.css`: the control and
  its glyph.
- `openspec/specs/workspace/spec.md` via this change's delta; `DESIGN.md` gains
  the control's recipe.
- Tests: `src/components/FolderRail.test.tsx` and `tests/e2e/workspace.spec.ts`.
- Version bump: minor for the feature commit (a new user-facing capability), a
  patch for the archive commit.
- ADRs: none. ADR-0006 holds: one anchor and three text files, no dependency, no
  state, no backend, nothing written to the vault.
- No experimental gate. `AGENTS.md` asks new capabilities to ship behind
  `flag || switch`, but that mechanism retired with reminders
  (`release-the-session-trace`), and restoring `features.ts`, prerelease mode, and
  the rail control to hide a link out of the app would cost more than the feature
  and would hide the one way to report anything. The precedent is
  `show-recent-changes-from-the-version-badge`: a stateless, additive surface that
  reads and writes nothing is a recorded exception, not a new precedent for
  stateful features.

## Non-goals

- No in-app form, no dialog, no feedback modal: the control leaves the app, and
  the issue page is where the writing happens.
- No version or browser prefilling in the issue URL. The chooser cannot carry
  field values, and a link that only leads to the bug form would drop the feature
  request path to save one copy-paste.
- No network call from the app, no issue API, no token, no analytics, no crash
  reporting.
- No change to the brand screen's repository line, to the tour control, or to the
  rail's other controls.
- No new dependency and no change to the offline/PWA behavior; the link does
  nothing without a browser tab and a connection, which is the user's own.
- No contributing guide, issue labels beyond the two the repository already has,
  or discussion links.
