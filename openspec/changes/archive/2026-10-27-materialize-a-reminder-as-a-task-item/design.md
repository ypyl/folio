# Design

## Context

See proposal.md — Why. The pieces that shape the approach:

- Materialization is one call site: `handleEditorReady` in `src/App.tsx` asks
  `unreferencedRules` which rules a day owes and appends each rule's reference
  through the editor's `appendMarkdown`.
- `appendMarkdown` inserts text at the document's end without claiming the
  selection or scrolling (release-reminders), and the normal save persists it.
- A GFM task item is three characters of text after a bullet, rendered as a
  checkbox by the grammar, ticked by a three-character edit (ADR-0033). No
  model, no index, no listener.
- `unreferencedRules` decides "already referenced" by scanning the note's links,
  which a task item holds exactly as a bare line does.

## Goals / Non-Goals

**Goals:**

- The line a day materializes carries the control that records it as done.
- The badge, the backlink, and the idempotency rule keep working unchanged.
- Nothing new on the keystroke path, no new save path, no new state on disk.

**Non-Goals:**

- No rewrite of lines already written, no migration, no `.folio/` change.
- No task feature beyond the marker: no counts, filters, or Tasks view.
- No change to the rule file, the row marker, or the day menu.

## Decisions

### D1: The prefix is written with the line, not added later

The materialized occurrence becomes `- [ ] ` plus the same ADR-0012 token the
line already carries. The token comes from `referenceToken(target, 'word')`, so
a single-word page still writes `#reading` and a name with spaces writes
`#[[Take pills]]`.

Alternative rejected: writing the bare line and letting the user add the marker.
That is the current behavior and the reason for the change.

### D2: Idempotency stays keyed on references, not on the marker

`unreferencedRules` compares the rule's page against the note's links, and a task
item holds the link identically, so the written line is still what makes the next
open append nothing. A note that already holds a bare `#[[Take pills]]` line from
before this change is equally satisfied: the app writes no second line and leaves
the old one alone.

Alternative rejected: matching the written line's exact text to decide whether an
occurrence exists. It would append a duplicate next to every bare line already in
a vault opened before this change, and it would make a hand-edited line read as
missing.

### D3: The tick needs no code

The checkbox is the editor's own widget (ADR-0033): its press writes the opposite
marker in one edit, the existing save persists it, the existing history undoes
it, and the badge's done scan (`doneTargets`) already reads a `- [x]` line that
references the rule's page. Materialization only has to produce the shape the
scan looks for.

### D4: The caret and the scroll are untouched

The line is still appended through `appendMarkdown`, which never claims the
selection and never scrolls, so opening a day still reads where the page left it.
The one visible difference is that the appended line now draws a checkbox.

### D5: No new measurement is needed

The change adds a five-character prefix to an insert that happens once per rule
when a day's editor mounts. It runs outside the typing path (it is not a
transaction hook and not a per-keystroke derivation), and the parse it triggers is
the same mount-time parse the append already triggered. Nothing scales with vault
or document size beyond that single insert.
