# Design

## Context

See proposal.md — Why. The pieces that shape the approach:

- The vault index already holds every page's saved text (`IndexPage.content`)
  and is patched by the write-through save, so the open day's note is readable
  from derived state without a second file read (ADR-0004).
- `src/vault/reminders.ts` is a pure parser/renderer/matcher for rules, and
  `src/App.tsx` owns the badge count and the `syncAppBadge` call.
- A tick writes three characters and is an ordinary save (ADR-0033), so the
  text in the file is the only record of "done" that exists or is needed.
- References are read by the shared scanner in `src/vault/parse.ts`, so a
  ticked line names the same page a rule names (ADR-0012).

## Goals / Non-Goals

**Goals:**

- A ticked reminder line removes its reminder from the badge count.
- The count stays a pure function of the rules and the open day's saved text.
- No new state on disk, no new save path, and nothing added to the keystroke
  path.

**Non-Goals:**

- No task model, index, count, or filter (ADR-0033 keeps that line).
- No change to materialization, to the rule file, or to the row marker.
- No new UI: no dismiss control, no "done" list, no per-day state.

## Decisions

### D1: "Done" is read from the note's text, not stored

A rule counts as done when the day's note holds a done task item that
references the rule's page. Nothing is derived that a cache could hold: the
ticked marker is in the file, so the state survives a reopen, survives another
editor, and needs no `.folio/` entry. Unticking the item brings the reminder
back, exactly as typing the tick removed it.

Alternative rejected: a dismissed-reminder list in `.folio/`. It would duplicate
what the note already says, drift from it the moment the user edits the line,
and add a second write path for a state the file already holds.

### D2: The task marker is read by its grammar shape

The scan looks for a list-item line whose content starts with `[x]` or `[X]`
followed by whitespace (`^\s*(?:[-*+]|\d{1,9}[.)])\s+\[[xX]\]\s`), which is the
rule `@codemirror/lang-markdown` applies before it renders a checkbox, and
reuses `findReferenceRanges` for the page names on that line. The marker must
start the item's content, so `[x]` in prose, a marker with no space after it,
and a bare `[x]` line are not done items.

Known approximation: a line inside a code fence that spells the exact form
reads as a done item even though the editor draws no checkbox there. The cost
is bounded and rare — the fenced line must name the very page the reminder
names, since a rule with no matching done reference still counts. Reading the
syntax tree instead would mean parsing the note outside the editor for one
badge count; that is a larger dependency than the drift it removes.

A reference on a continuation line of a done item (the item's text wraps) does
not record it, because the marker's line is the line that is read. The
materialized line the app itself writes is not a task item at all, so it reads
as pending until the user makes it one and ticks it.

### D3: The scan follows the saved note, not the live draft

The badge derives from the open day's `IndexPage.content`, memoized on that
page's identity. A save patches the index, the page identity changes, and the
count recomputes; an index refresh carries an unchanged page over, so it does
not. A keystroke touches neither, so the scan never runs on the typing path
(AGENTS.md's budget): a day note of any size costs one pass when it is saved or
opened, not one per character.

The consequence is a bounded lag: ticking an item clears the badge when the
debounced save lands (about a second), not on the press. That lag is the same
one every other derived surface already has, and it is the price of keeping the
count off the keystroke path.

Alternative rejected: scanning the editor's live document on every change. It
is one pass over the note per keystroke, which is measurable on a long day, and
it would call the badge API on every character typed.

### D4: Materialization is untouched

The tick does not remove the line, so the day still references the page, so
`unreferencedRules` still appends nothing on the next open. The badge is the
only surface that changes: the rule stays live for later days, the note keeps
its record, and the page's backlinks keep the day.
