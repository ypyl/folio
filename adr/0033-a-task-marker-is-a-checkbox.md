# ADR-0033: A GFM task marker is a checkbox, and the marker is the text

- Status: Accepted
- Date: 2026-10-25

## Context

A GFM task list item is ordinary Markdown: `- [ ]` and `- [x]` are three
characters of text after a bullet. The page surface is that text (ADR-0029), so
a folder written in another editor showed its checklists as literal brackets.
The grammar already reads them: `@codemirror/lang-markdown` carries GFM, and a
task item parses to a `ListItem` holding a `Task` node whose `TaskMarker` covers
exactly the brackets, only when they start the item's content and are followed
by whitespace.

Two questions had to be settled. Whether a checkbox belongs in Folio at all,
given the scope guardrail against rebuilding Logseq (ADR-0006) and the refusal
to parse other tools' conventions (ADR-0012). And, if it does, whether the app
gains a task model: an index of tasks, counts, filters, a Tasks page.

The first answers itself: a checklist line is Markdown, not a Folio feature, and
leaving it as brackets is the surface failing to render the document it holds.
The second does not follow from the first.

## Decision

**A GFM task item's marker renders as a native checkbox.** The `TaskMarker`
range is replaced by an `<input type="checkbox">`, unchecked for `[ ]` and
checked for `[x]` or `[X]`. The grammar decides where one appears, so prose,
code, and a marker with no space after it stay text.

**A press writes the opposite marker in one edit.** The box handles its own
press, so the caret does not move and nothing opens. The edit is three
characters, which means the existing save persists it and the existing history
undoes it. There is no app-level listener and no new adapter hook: a tick is an
edit, not a command.

**The marker is never revealed while the caret is near it.** Inline markers come
back as source when the selection touches them, because the source is what an
edit changes. A task marker's content is its two states, and both are reachable
by the control, so the box stays a box. The caret steps over the marker instead
of landing inside it.

**Folio keeps no task model.** Nothing indexes task lines, counts them, filters
by them, or lists them. A task item is a line with a control on it.

## Consequences

- A checklist written anywhere renders in Folio without a conversion step, and a
  tick is a three-character edit to the file.
- The import keeps its own mapping: Logseq's `TODO` / `DONE` keywords are still
  page references (ADR-0025), and a `- [ ]` line imported from Logseq stays a
  task item. Two task conventions therefore exist in a converted vault, one
  rendered as a checkbox and one as a badge. That is Logseq's own split, and
  Folio does not reconcile it.
- Removing a task marker is a deletion, not an un-tick. Backspace over the
  atomic range removes the three characters, and the item becomes an ordinary
  bullet.
- The reading view still shows the brackets: the presentation renderer is a
  minimal static pass over blocks, and the checkbox is the editor's surface.
- The cost on the keystroke path was measured before the decision: on a
  5,174-line page with 300 task items, 64 to 300 checkboxes in view, the added
  time per keystroke did not rise above the benchmark's own noise floor (the
  control run, with the same code on both sides, showed the same delta). The
  widget resolves its offset at press time rather than storing it, so CodeMirror
  reuses the same element across keystrokes and typing rebuilds no checkbox DOM.
- A new task syntax would need a new ADR. This one covers GFM's marker only.
