# Design

## Context

See proposal.md. The app already keeps a shipped-but-hidden capability behind a
constant: `PRESENT_ENABLED = false` in `Sidebar`, with the `onPresent` seam and
the view kept so re-enabling is flipping the flag. Reminders are in the same
position. Three places run the feature: the calendar day menu (`Sidebar`), the
badge (`App`), and materialization on open (`App`).

## Goals / Non-Goals

**Goals:**
- One flag that turns the whole feature off, and back on.

**Non-Goals:**
- A runtime toggle or a stored preference.

## Decisions

**D1: The flag lives in `src/features.ts`.** `PRESENT_ENABLED` is local to
`Sidebar`, but reminders are read by both `Sidebar` and `App`, so the flag needs
a shared home. One exported constant, `REMINDERS_ENABLED = false`, with a comment
that flipping it is the enable step. A build-time constant, not a preference:
the app keeps no settings store, and the vault holds no flag.

**D2: The flag gates all three entry points.** `Sidebar` offers no day-menu
items when it is off, `App` sets no badge and materializes nothing. Gating the
engine too (not only the menu) means a disabled feature cannot write into a
journal, which is the safer default; the parser and the matcher still read
`.folio/reminders.md`, so nothing is lost when it is turned back on.

Alternative considered: gate only the menu, leaving the engine live. Rejected
because a hand-written rule would then write lines with no UI to remove it.

## Risks / Trade-offs

- **The flag could rot.** The tests cover both states where they can; the
  materialization and menu tests run with the flag on by overriding it in the
  test, so the engine stays exercised while the shipped build is off.
