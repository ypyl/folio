# Proposal

## Why

The guided demo's most important warning - edits last for the session and are
never saved to disk - is the first paragraph of its Welcome page. That paragraph
scrolls away, and a newcomer who lands on any other guide page, or who opens the
demo and starts editing, may never read it. Losing edits on reload without
having seen the warning is a bad first impression.

## What Changes

- Every page in the demo shows a persistent notice at the top of the editor
  pane: the demo's changes are session-only and are never written to disk.
- The notice stays visible while the page scrolls, so it cannot be scrolled out
  of sight.
- The notice appears only in the demo. A real vault, the brand screen, and the
  board and results views are unchanged.
- The notice is presentational: it adds no control, dismisses nothing, and
  writes nothing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `demo`: the demo's session-only rule is shown on every demo page as a
  persistent notice, not only in the Welcome page's text.

## Impact

- `src/components/EditorPane.tsx` and `EditorPane.module.css`: the notice and
  its sticky placement at the top of the editor pane.
- `src/App.tsx`: passes the active folder's demo flag to the editor pane.
- Tests: `src/components/EditorPane.integration.test.tsx` for the notice's
  presence and absence, and `tests/e2e/demo.spec.ts` for its visibility while
  the page scrolls.
- No storage, no dependency, no editor-layer change, no new work on the typing
  path. The notice is one static element rendered once per demo page mount.

## Non-goals

- No dismiss control, no modal, no onboarding step.
- No change to the Welcome page's existing explanation.
- No notice in a real vault, on the brand screen, or in board and results mode.
- No change to what the demo saves, or to its session-only lifetime.
