# Proposal

## Why

The no-folder state ("Open a folder to begin.") is the first thing a new user
sees, but it says nothing about what Folio is or does, and the app tour's only
entry point is an unlabelled `?` at the bottom of the rail that a first-time
visitor has no reason to find. The landing screen should say what the app is,
what it can do, and how to see the tour.

## What Changes

- The brand screen (the no-folder state) gains a short description of Folio: a
  local-first notes app whose Markdown folder is the database, with notes that
  stay on the user's machine.
- It gains a compact set of facts about what the app does: pages and journals
  are plain Markdown, a page is referenced with `#word` or `#[[Page]]`, and a
  whiteboard with `#!board`.
- It gains a tour reference: a "Take the tour" control that opens the app tour,
  shown only where the tour is available (viewports wider than the compact
  breakpoint), matching the rail's tour control. The surrounding copy points at
  the rail's `?` control as the tour's other home.
- The new copy is informational only. The brand screen still offers the Logseq
  import and the repository link exactly where it already does.
- No new ADR: this is copy and layout on an existing surface, with no
  architectural decision.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `workspace`: the brand-screen requirement gains the description, the facts,
  and the tour reference; the app-tour requirement gains the brand screen as a
  second entry point.

## Impact

- `src/components/EditorPane.tsx` and `EditorPane.module.css`: the brand-screen
  block and its copy.
- `src/App.tsx`: hand the editor pane the same tour callback the rail gets
  (wide only), so the brand screen can open the tour.
- Tests: `src/App.integration.test.tsx`,
  `src/components/EditorPane.integration.test.tsx`, and
  `tests/e2e/workspace.spec.ts`.
- No vault, storage, index, or Markdown changes.

## Non-goals

- Not a marketing page: no screenshots, feature carousel, pricing, or new
  outbound links beyond the repository link that already exists.
- No new tour steps, and no change to the tour's content or geometry.
- The new copy and the tour reference do not appear on the compact shell, where
  the tour does not exist.
- No new persisted state, no first-run flag, and nothing written to the vault.
