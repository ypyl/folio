# Proposal

## Why

Reminders are complete and behind a build flag: the rule engine, the calendar
day menu, the replacement confirmation, removal from the page row, the badge, and
the line materialized into the day's note. The flag was set three days ago because
the feature was "half-settled": the menu had no heading, replacement was silent,
past days were not handled, and removal lived in the wrong place. All of that has
landed since.

A release review found three things worth closing rather than shipping with the
flag off:

- **Materializing an occurrence hijacks the view.** The line is appended with
  `selection` and `scrollIntoView`, so opening a long day scrolls the note to its
  end and moves the caret there, for a write the user did not ask for. That is
  worse the longer the notes get.
- **Nothing shows that a reminder exists.** The only surface is the occurrence
  line on the days it falls due. A yearly reminder set in March is invisible in
  April: not on the page's row, not on the calendar, only in the row menu caption
  that removes it. A user cannot answer "which pages have reminders?".
- **The gate has become a lie.** Prerelease mode exists to preview flagged
  features and reminders are the only flagged feature, so promoting reminders
  leaves the rail's toggle switching nothing.

## What Changes

- **Reminders ship in every build.** The build flag, the `prerelease OR flag`
  gate, and the four gates that read it go. The rule parser, the matcher, the
  `.folio/reminders.md` handling, and every behaviour stay exactly as they are.
- **An occurrence is written without moving the view.** The line still appends at
  the end of the note, as an ordinary undoable edit that the normal save
  persists, but the caret and the scroll position are left where they were.
- **A page row marks a page that has a reminder rule**, in the same badge
  treatment the `b` and `a` kind badges use, so the Files listing answers
  "which pages have reminders?" at a glance. The state stays reachable through
  the row's own menu for assistive technology.
- **Prerelease mode retires.** Its preference, its rail control, and its spec go;
  with no flagged feature left it cannot change anything. The mechanism is in the
  history if a future flag needs it.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `reminders`: the gate requirement is removed; materializing an occurrence is
  view-neutral; a page row shows a marker; the row-removal requirement loses its
  disabled-feature clauses.
- `navigation`: a page row's badge sentence admits the reminder marker.
- `workspace`: the folder rail's control order no longer includes a prerelease
  control.

### Removed Capabilities

- `prerelease`: the mode, its rail control, and its preference.

## Non-goals

- No new recurrence and no change to the rule file's shape or format.
- No calendar day marker: a day cell would have to evaluate every rule against
  all 42 visible days, and a daily rule would mark every cell.
- No status-bar count and no closed-app delivery: the day's note is the surface
  and the app-icon badge is the installed-app extra (ADR-0032).
- No migration of the stored `folio.prerelease` preference; an unread key is
  harmless.

## Impact

- `src/features.ts` deleted; `src/prerelease.ts` and its test deleted.
- `src/App.tsx`: the reminder gate goes, and with it the prerelease state and the
  rail props; materialization calls the editor seam's append as-is.
- `src/editor/{editor,codemirror}.ts`: the append no longer sets a selection or
  scrolls.
- `src/components/{Sidebar,FolderRail}.tsx` and their CSS: the row marker, and
  the rail loses its toggle.
- `playwright.config.ts`: `VITE_REMINDERS=1` goes, so the e2e runs the build a
  user runs.
- `README.md`, `DESIGN.md`: the release note and the marker's rule.
- Tests: the App suite stops flipping the flag; a CodeMirror test covers the
  append; new tests pin the marker and the caret.
- Version bump: a minor bump (a capability that was hidden is now on).
