# Proposal

## Why

The session trace is complete: the per-folder log, its events, its seven-day
retention, its failure isolation, and its no-page-text rule. It has been exercised
by the e2e suite since it landed, and the incident it was built for is answerable
from `.folio/logs/` in a shipped build only if someone finds and flips the flask
on the rail first.

The gate has also become a lie. Prerelease mode exists to preview features that
ship behind a flag, and the trace is its only flagged feature, so shipping the
trace leaves the rail's switch switching nothing. Either the trace ships or the
switch is decoration.

One thing the gate hid: the trace's privacy and volume properties. Shipping it
turns tracing on for every folder every user opens, so both are stated plainly
here and kept as they are: no page text, a 2000-line cap per file, seven days of
retention, and no directory created for a vault that is never opened.

## What Changes

- **Tracing runs for every real folder.** The build flag, the `VITE_TRACE`
  environment variable, the `flag || switch` gate, and the prerelease mode go.
  The trace engine, its events, its file naming, its retention, and its failure
  isolation stay exactly as they are.
- **Prerelease mode retires with its last feature.** Its preference, its rail
  control, its hover popup, and its spec go; the rail's bottom group keeps the
  tour control. The mechanism stays in the history if a future flag needs it.
- **The e2e runs the build a user runs.** `playwright.config.ts` drops
  `VITE_TRACE`, and the diagnostics suite asserts the trace without a switch.
- **The demo still writes nothing.** It has no folder, so there is nothing to
  trace; that rule and its test stay.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `diagnostics`: the gate requirement is removed; a real folder is traced in
  every build, and the requirements that said "with tracing enabled" say so
  without a gate.
- `workspace`: the folder rail's control order no longer includes a prerelease
  control, and the tour control stays the rail's last.

### Removed Capabilities

- `prerelease`: the mode, its rail control, its hover popup, and its
  browser-local preference.

## Non-goals

- No log viewer, no export, no status-bar entry, and no remote reporting: the
  file in `.folio/logs/` is still the whole interface.
- No change to the trace's format, its events, its 2000-line cap, its seven-day
  retention, its file naming, or its privacy rule.
- No change to when saves happen, how failures are reported, or the flush on
  hide. The trace observes those paths; it does not alter them.
- No migration of the stored `folio.prerelease` preference: an unread key is
  harmless.
- No trace for the guided demo, which has no folder to write into.
- No opt-out setting. A user who wants no `.folio/logs/` deletes the files; they
  are the only thing the app ever removes, on its own seven-day schedule.

## Impact

- `src/features.ts` and `src/features.test.ts` deleted; `src/prerelease.ts` and
  its test deleted.
- `src/App.tsx`: the gate and the prerelease state go, so the session exists for
  any real folder; the rail props for the switch go.
- `src/components/FolderRail.tsx` and `FolderRail.module.css`: the experimental
  control, its popup, and their styles go; the bottom group holds the tour
  control.
- `src/components/FolderRail.test.tsx`: the switch and popup cases go.
- `src/App.integration.test.tsx`: the switch-driven trace cases become the
  shipped behavior.
- `tests/e2e/diagnostics.spec.ts` and `tests/e2e/workspace.spec.ts`: no switch to
  click, and the switch's popup test goes.
- `playwright.config.ts`: `VITE_TRACE` drops out of the web server's environment.
- `README.md`, `DESIGN.md`: the Diagnostics section describes a feature, not a
  gate; the rail control's design entry goes.
- ADR-0035: the paragraph recording the gate becomes the release decision.
- Version bump: a minor bump for the feature commit, a patch for the archive
  commit.
