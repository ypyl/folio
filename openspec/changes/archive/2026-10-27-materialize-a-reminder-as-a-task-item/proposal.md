# Proposal

## Why

Opening a due journal day writes a bare reference line (`#[[Take pills]]`), so
the reminder is a plain link. Marking it done means deleting the line, typing a
`- [ ]` in front of it, and ticking the box. Since ADR-0033 a task item is a
ticked checkbox and a tick is the app's one gesture for "this is done", the app
should write the reminder in the form the user acts on: `- [ ] #[[Take pills]]`.
The badge already stops counting a reminder whose line is ticked
(ADR-0032), so the materialized line should carry the control that records it.

## What Changes

- **A materialized occurrence is a task item.** Opening a day whose matching
  rule's page the note does not reference appends `- [ ] <reference>`, the
  reference being the same ADR-0012 token the line carries today, instead of a
  bare reference line.
- **The tick is the app's own edit.** The box is the editor's checkbox
  (ADR-0033), so a press writes the marker through the normal save and the
  existing history. No new control, no new save path, no app-level listener.
- **The badge agrees.** An unticked item still counts (an occurrence is
  pending), a ticked one stops counting, so opening a day and ticking a line now
  clears that reminder from the badge without the user retyping the line.
- **Nothing else changes.** The rule file, the row marker, the day menu, and the
  removal paths are untouched. A day that already references the page, in either
  form, still writes nothing.

## Non-goals

- No task model, task index, counts, filters, or Tasks page (ADR-0033 keeps that
  line).
- No rewrite of existing notes: a bare reference line already materialized stays
  as it is and is still a valid occurrence.
- No reminder list, section, or completion state outside the note itself
  (ADR-0032).

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `reminders`: the occurrence a day materializes is a task item rather than a
  bare reference line, so it can be ticked.

## Impact

- `src/App.tsx` (the materialization call on editor mount).
- `src/vault/reminders.ts` and `src/rows.ts` are unchanged; `unreferencedRules`
  keeps keying on references, which a task item still holds.
- Tests: `src/App.integration.test.tsx` expectations about the written line.
- ADR-0032's decision text is amended in place, since the line it decides is
  written now carries a marker.
