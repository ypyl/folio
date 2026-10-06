# Proposal

## Why

The brand screen's repository link is a bare "GitHub" at the bottom of the
screen. A user who finds a bug or wants a feature has no signal that the
project's issue tracker is the place to report it, so feedback goes nowhere.

## What Changes

- The brand screen's repository area gains a line stating that bugs and feature
  requests are reported on the project's public repository, with the repository
  link inside that line.
- The line shows in every no-folder state, alongside the repository link it
  already shows.
- No new ADR: copy on an existing surface.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `workspace`: the brand-screen requirement gains the issue-reporting line
  beside the repository link.

## Impact

- `src/components/EditorPane.tsx` and `EditorPane.module.css`: the brand-screen
  repository area.
- Tests: `src/App.integration.test.tsx`,
  `src/components/EditorPane.integration.test.tsx`, and
  `tests/e2e/workspace.spec.ts`.

## Non-goals

- No new links, and no change to where the repository link points.
- No change to the repository link's accessible name or its new-tab behavior.
- No issue form, tracker integration, or backend.
