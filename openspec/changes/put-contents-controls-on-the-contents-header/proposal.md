# Proposal

## Why

Expand all and Collapse all are controls over the whole outline, but they sit in
the Contents body above the rows, costing a line of side-panel height and
vanishing when the section is collapsed. The Journal section already shows the
alternative: its session controls ride the section's own summary row, in reach at
every state and at no height cost (put-nav-controls-on-the-journal-header).

## What Changes

- Move Expand all and Collapse all from a control line inside the Contents body
  onto the **Contents section's summary row**, at its trailing edge ahead of the
  disclosure marker, in that order — the treatment the Journal row's session
  navigation already has.
- The Contents summary stays one row tall; the controls are sentence-case text at
  the row's own size, and they ride it whether the section is open or collapsed.
- Activating one changes what the outline shows; it does not open or close the
  Contents section.
- Behavior is unchanged: the same two names, the same effect on every subtree,
  the same view-only terms (nothing written, no edit, no caret or scroll move),
  and the same rule that they appear only while the open page has headings.
- The body's sticky control line and its styles go.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `contents`: the requirement for the whole-outline controls now places them on
  the Contents section's summary row rather than in the section body, and adds
  that they survive a collapsed section and never toggle it.

## Impact

- `src/components/MetaPanel.tsx` + `MetaPanel.module.css` — the two controls move
  into the Contents accordion's `actions`; the sticky tool row and its styles go.
- `src/components/Accordion.tsx` — no change; the `actions` slot already exists
  and already cancels the summary's default toggle.
- Tests: `src/components/MetaPanel.test.tsx` (the controls sit on the Contents
  summary, survive a collapsed section, and do not toggle it).
- No keystroke-path cost, no measurement to carry: the controls are two static
  buttons built once per render off the same memoized tree, and the tree,
  collapse set, and handler identities are unchanged.
- No `VaultStorage`, index, editor, search, or copy changes; no ADR.

## Non-goals

- No change to what the two controls do, their names, order, or the view-only
  terms they keep.
- No change to per-heading disclosure controls, the Contents rows, the tree, or
  the collapse-state lifetime.
- No new control, setting, keyboard chord, or ADR.
