# Proposal

## Why

The tour is a wide-viewport overlay offered from two places: a `?` at the rail's
bottom and a "Take the tour" line on the brand screen. Neither is what a new
user wants first. The brand screen is where they open a folder or the demo, and
the rail's bottom is where they report a problem, so the tour competes with both
actions and its steps explain regions a new user has not opened yet. The tour is
a thing to take while trying Folio, which is exactly what the guided demo is for.

## What Changes

- **The rail's bottom group holds one control.** While the guided demo vault is
  the active folder, and only above the compact breakpoint, it is the tour
  control. In every other state it is the feedback control that
  `add-a-feedback-control` put there.
- **The tour is reached only from the demo.** `App` supplies the tour callback
  only while the demo is active on a wide viewport, so the demo's rail carries
  the `?` and a real folder's rail does not.
- **The brand screen no longer opens or names the tour.** Its footer keeps one
  line, the issue-reporting line, and the tour reference goes, along with the
  copy that named the rail's `?` as the tour's other home.
- **The tour's copy names the demo it runs in.** Its editor step stops pointing
  at a demo the reader would have to leave the tour to find and names the vault
  the tour is walking instead.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace`: the rail's bottom-group requirement becomes a one-control rule
  keyed on the demo; the tour requirement's entry points narrow to the demo's
  rail control, and its editor-step copy changes; the brand-screen requirement
  loses its tour reference and the copy in the footer that named it.

## Impact

- `src/App.tsx`: the tour callback is gated on the active demo vault and the wide
  viewport, and the brand screen is handed no tour callback.
- `src/components/FolderRail.tsx`, `FolderRail.module.css`: the bottom group
  renders the tour control or the feedback control, never both.
- `src/components/EditorPane.tsx`, `EditorPane.module.css`: the `onTour` prop,
  the tour line, and its `.tourLink` style go.
- `src/tour/steps.ts`: the editor step's copy.

## Non-goals

- No change to the tour itself: the same five steps, the same cut-out, the same
  focus contract, the same Escape and skip controls.
- No change to the feedback control, its destination, or the issue templates.
- No tour on the compact shell. A phone still has no tour, in the demo or
  outside it, so the demo's compact rail carries the feedback control.
- No demo content change: the Welcome page does not gain a line about the tour.
- No stored preference, no per-vault memory of a finished tour, no auto-launch.
- No experimental gate. This narrows an existing surface rather than adding a
  capability, which is the `AGENTS.md` exception the changelog badge and the
  feedback control already record.

## Removed capability surface

- The rail's tour control for a real vault, and the brand screen's tour
  reference. Both are removals, not deprecations: nothing replaces them, and the
  demo's rail control is the tour's one entry point.
