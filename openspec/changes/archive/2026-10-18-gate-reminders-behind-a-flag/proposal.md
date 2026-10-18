# Proposal

## Why

The reminders feature is built and shipped, but it is not ready to expose: the
calendar day menu's items and the app badge would put a half-settled feature in
front of users. The code and its seams should stay, so re-enabling is flipping
one flag, the way Presenting is kept behind `PRESENT_ENABLED`.

## What Changes

- **A `REMINDERS_ENABLED` flag, off in the shipped build.** It lives beside the
  app's other feature flag and is the single enable step.
- **While off, the reminders UI is absent:** the Journal calendar's day menu
  offers no reminder items, and the app sets no reminder badge.
- **While off, the engine does not act:** opening a journal day materializes no
  reminder line, so a disabled feature writes nothing.
- **The engine itself stays:** the rule parser, the matcher, the storage in
  `.folio/reminders.md`, and the seams are unchanged, so flipping the flag turns
  the feature back on with no other work.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `reminders`: the feature is gated by a flag; while it is off, the day menu
  offers no reminder items, no badge is set, and no occurrence is materialized.

## Non-goals

- No removal of the reminders code, tests, or `.folio/reminders.md` handling.
- No new user setting; the flag is a build-time constant, not a preference.
- No change to the rule grammar or matching.

## Impact

- `src/features.ts`: a new module holding the flag.
- `src/components/Sidebar.tsx`: the day menu's reminder items are gated.
- `src/App.tsx`: the badge and the materialization are gated.
- Version bump: a patch bump.
