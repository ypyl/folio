# Proposal

## Why

The reminders feature ships behind a build-time flag, so nobody can try it
without a rebuild. A user who wants the unreleased feature should be able to turn
it on from the UI, and turn it off again, without a special build. The same
switch should serve every future feature that ships behind a flag.

## What Changes

- **A prerelease mode, toggled from the folder rail.** A control beside the tour
  control turns it on and off, and reports its state to assistive technology.
- **The mode persists across reloads** as a browser-local app preference, not as
  vault content: it is the same on every vault, and it never writes a file.
- **Prerelease mode enables gated features.** A feature whose build-time flag is
  off (reminders) turns on while the mode is on. Turning the mode off returns to
  the shipped build's behavior.
- **Reminders honour the mode.** With the build flag off and prerelease mode on,
  the Journal calendar's day menu, the badge, and materialization work as they do
  when the flag is on. With both off, the feature stays hidden.

## Capabilities

### New Capabilities

- `prerelease`: the app-level prerelease preference, its rail control, its
  persistence, and its effect of enabling features that ship behind a flag.

### Modified Capabilities

- `reminders`: the feature is enabled when its build-time flag is on or
  prerelease mode is on, and is absent when both are off.
- `workspace`: the folder rail gains the prerelease control before the tour
  control, which stays the rail's last control.

## Non-goals

- No per-vault prerelease setting; the mode is app-level and global.
- No other setting, settings panel, or settings store.
- No change to which features exist or how a gated feature behaves once enabled.
- No build-time removal of the flag; prerelease mode is layered on top of it.

## Impact

- `src/prerelease.ts`: the preference's read/write and a `usePrerelease` hook.
- `src/components/FolderRail.tsx` and its CSS: the toggle and its state.
- `src/App.tsx`: the effective reminder gate is `build flag or prerelease`.
- `src/components/Sidebar.tsx`: the day menu takes the effective gate as a prop.
- Version bump: a minor bump, since a user can now turn on a feature.
