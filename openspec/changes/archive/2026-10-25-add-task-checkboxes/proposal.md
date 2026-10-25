# Proposal

## Why

A GFM task list is ordinary Markdown: `- [ ]` and `- [x]` are text a user can
type in any editor. In Folio they render as the literal brackets, so a folder
written in another tool looks unfinished the moment it has a checklist, and
there is no way to tick an item without editing three characters by hand. The
parsing is already free: `@codemirror/lang-markdown` ships GFM, and the syntax
tree carries a `Task` node with a `TaskMarker` over the brackets.

## What Changes

- **A task marker renders as a checkbox.** `[ ]` and `[x]` after a list item's
  bullet are replaced by one checkbox control, on and off respectively. The
  Markdown itself is untouched: the file still holds the brackets.
- **A press toggles the item.** Pressing the box writes the opposite marker in
  one edit, so the normal save persists it and the normal undo reverts it. The
  caret does not move and the open page does not navigate.
- **Only GFM decides.** The checkbox appears where the GFM parser reads a task
  list item: inside a list item, followed by a space. `[ ]` in prose, in a code
  fence, or in a standalone line stays the text it is.
- **`[X]` reads as checked.** GFM accepts either case, so the control reflects
  both and writes back the form the user's file already uses.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `editing`: a GFM task item renders as a checkbox, and pressing it writes the
  toggled marker back as text.

## Non-goals

- No task index, no counts, no filtering, no "Tasks" page or panel. The checkbox
  is a rendering of the line in front of it and nothing aggregates it.
- No other task syntax. Logseq's `TODO` / `DONE` keywords stay what the importer
  already makes of them, page references; ADR-0012 keeps unsupported
  conventions as text.
- No change to the reading view's static HTML, which keeps rendering blocks as
  text, or to what the Logseq import does with a `- [ ]` line.
- No change to the markers when a page is copied: the clipboard carries the
  Markdown, as it already does.

## Impact

- `src/editor/codemirror.ts`: one widget, one decoration branch in the existing
  viewport-scoped render pass, and one press branch beside the reference chips.
- `src/index.css`: the checkbox's paint, under the `.editor` surface, against the
  app's tokens.
- `DESIGN.md`: a Tasks rule beside Lists.
- `adr/0033-a-task-marker-is-a-checkbox.md`: the decision, with the measured
  cost of the widget on the keystroke path.
- Tests: the CodeMirror integration suite (rendering, toggling, text preserved,
  non-task text left alone) and the ADR table.
- Version bump: a minor bump (a new user-facing capability).
