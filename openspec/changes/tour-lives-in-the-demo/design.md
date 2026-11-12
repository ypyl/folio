# Design

## Context

See `proposal.md`. Two callbacks today decide the tour: `App`'s `onTour` is
`compact ? undefined : () => setTourOpen(true)` and it feeds two consumers, the
rail (`FolderRail.onTour`) and the brand screen (`EditorPane.onTour`). The rail's
bottom group renders the feedback anchor unconditionally and the tour control
whenever `onTour` is supplied (`add-a-feedback-control`). `demoActive` is derived
in `App` from the active folder's `demo` flag and is already threaded into the
editor pane and the demo notice.

## Goals / Non-Goals

**Goals:**

- One tour entry point, inside the demo, at the rail's bottom.
- The rail's bottom group reads as one slot: the demo's tour, otherwise feedback.
- No new state, no new dependency, no change to the tour's overlay or steps.

**Non-Goals:**

- No auto-launch when the demo opens, and no "seen the tour" memory.
- No tour on compact; the demo's compact rail holds the feedback control.
- No change to the feedback control, the issue templates, or the demo's content.

## Decisions

**`App` gates the tour callback on the demo and the wide viewport.**
`onTour` becomes `demoActive && !compact ? () => setTourOpen(true) : undefined`,
and only the rail receives it. The rail then keeps the optional-callback shape it
already documents (`onAdd`, `onTour`): a prop that is absent when the control
must not exist. Reading the gate where `demoActive` is derived keeps the
composition rule in one place, and closing or switching away from the demo
removes the control with the folder.

**The rail's bottom group renders the tour control or the feedback anchor, not
both.** One ternary in `FolderRail`, keyed on `onTour`, which is exactly the
condition the tour exists under. This keeps the DOM the same depth and the
bottom-group CSS untouched: both controls already share the 40px box, the 48px
compact target, and the same surface.

**The brand screen stops opening the tour and names it instead.** `EditorPane`
loses `onTour` and the "New here? Take the tour" line, including its
`.tourLink` style. In its place, and only where the tour exists, the footer says
where the tour is taken. That keeps discoverability (the tour is now one rail
control away, in the demo) without a control that cannot open it, and it keeps
the screen's one-link rule: the repository link stays the only control in the
footer. The copy is composed by hand, not a callback: a boolean prop
(`tourHint`) replaces the callback, which is what lets the compact screen carry
no tour reference at all.

Exact copy (subject to review): "New here? The guided demo is a worked example
of every feature; the ? at the bottom of the left rail takes the tour."

*Rejected:* keeping the brand screen's "Take the tour" control and opening the
demo with it. It is still a tour button in the normal view, it makes one control
do two things, and it would start the tour while the demo is still activating.

**The tour's editor step describes the vault it is walking.** The old copy
pointed at the demo "from the brand screen", which a reader inside the tour no
longer is. The step now says the page they are looking at is the demo's worked
example. Copy only: no step, selector, or geometry changes.

## Risks / Trade-offs

- [Feedback is unreachable while the demo is open] → accepted, per the requested
  swap: the demo's rail carries the tour, and the brand screen is not on screen
  while a folder is open. The issue templates and the release notes still carry
  the route, and a user who closes the demo lands back on the brand screen's
  issue line.
- [A first-time user opens a real folder and never finds the tour] → the brand
  screen names it, next to the guided demo it belongs to.
- [The tour's `?` and the feedback bubble share a slot] → one control at a time,
  same box and surface, so the slot never moves and no layout changes.
- [Demo-gated state could leak into a saved preference] → nothing is stored: the
  gate reads the active folder's own flag, which is session state for the demo.
