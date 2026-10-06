# Design

## Context

See `proposal.md` for motivation. The brand screen is rendered by
`EditorPane` when `page === null` (the no-folder state), which already takes
`emptyHint` and a `brandAction` slot. The tour lives in `App` (`tourOpen`), is
opened from the rail's `?` control, and is wide-only (`onTour` is passed to the
rail only when `!compact`). `Tour` already captures the element that opened it
and restores focus on close, so any opener works without new focus plumbing.

## Goals / Non-Goals

**Goals:**

- Say what Folio is and what it does on the first screen.
- Make the tour discoverable from the first screen, without hiding that the rail
  holds the same control.
- Keep the brand screen one compact centered column; no new surface, state, or
  storage.

**Non-Goals:**

- No new tour content, steps, or geometry.
- No compact-shell variant (the tour does not exist there).
- No marketing layout (columns, cards, imagery) and no new dependencies.

## Decisions

**The copy lives in `EditorPane`, not `App`.** The brand screen is the pane's
surface; the description and facts are static, so they are literals beside the
existing `EMPTY_HINTS`. Only the tour callback is dynamic, so it arrives as a
prop.

**The tour reference is a control, not just a sentence.** The user asked for a
reference to the tour button; a first-time visitor reading a sentence about a
`?` they have not noticed is weaker than a control they can press. So the block
carries a `Take the tour` control that calls the same callback the rail uses,
and the surrounding copy also names the rail's `?` so the two homes are linked.
Alternative considered: a bare sentence pointing at the rail. Rejected as
discoverability that solves nothing.

**`onTour` is a new optional prop on `EditorPane`,** the same optional-callback
shape `FolderRail.onTour` uses, and `App` passes it only when `!compact` — one
condition, one callback, both entry points. Absent, the block shows the
description and facts without the tour line.

**The block renders only for the settled no-folder states,** not the
transitional `notes` hint (`emptyHint !== 'notes'`). That hint exists to avoid a
one-frame "open a folder" flash while a stored folder restores; the new copy
must not reintroduce a flash of a different kind.

**Styling reuses existing contracts.** The description keeps the tagline's
centered 46ch measure; the facts are a second short paragraph. The tour control
follows DESIGN.md's single link behavior (brand ink, no underline, hover tint),
the same treatment as the existing repository link, since it is an action and
brand ink therefore reads correctly as clickable.

Exact copy (subject to review):

- Description: "Folio is a local-first notes app. Your Markdown folder is the
  database: open it in the browser and your notes stay on your machine."
- Facts: "Pages and journals are plain Markdown. Link a page with #word or
  #[[Page]], and a whiteboard with #!board."
- Tour line: "New here? Take the tour, or use the ? in the left rail." where
  "Take the tour" is the control.

## Risks / Trade-offs

- [Brand screen gets busy] → the new block is two short paragraphs plus one
  line, inside the existing centered measure; the mark and tagline stay first.
- [Two tour entry points drift] → both call one `App` callback; focus return is
  already opener-agnostic in `Tour`.
- [Copy drifts from the app's grammar] → the facts restate the tour's editor
  step and ADR-0024's `#!` board form; keep the two in sync.
