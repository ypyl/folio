# Design

## Context

See proposal.md — Why. The pieces that shape the approach:

- The editor surface is the Markdown text (ADR-0029). Every rendering is a
  view-only decoration over that text; nothing serializes, and a save writes the
  document as it stands.
- `@codemirror/lang-markdown` is configured with `markdownLanguage`, which
  already carries GFM. A task list item parses to a `ListItem` holding a `Task`
  node whose `TaskMarker` covers exactly `[ ]`, `[x]`, or `[X]`. The grammar
  only accepts the marker when it starts the item's content and is followed by
  a space or tab, which is the rule the change needs and does not have to
  implement.
- `render()` in `src/editor/codemirror.ts` already builds every decoration over
  `view.visibleRanges` only, inside two syntax-tree passes and one visible-line
  scan, so a new branch in that pass costs no new pass and no full-document
  work.
- The image widget and the table block already show the pattern for a widget
  that owns its DOM, and `ImageWidget` shows that a widget may bring its own
  press handling.

## Goals / Non-Goals

**Goals:**

- A GFM task item reads as a checkbox and toggles with one press.
- The text stays the file's own bytes: `- [ ]` and `- [x]` are written exactly
  as typed, and a toggle writes exactly three characters.
- The feature adds nothing measurable to typing, in a page with tasks or
  without.

**Non-Goals:**

- No task index, no counts, no filters, no task-specific navigation.
- No second task syntax and no import change.
- No reveal-on-caret editing of the marker: the box is the control.

## Decisions

### D1: GFM decides where a checkbox appears

The `TaskMarker` node is the only trigger. Nothing scans lines for `[ ]`, so the
checkbox appears exactly where Markdown means a task and nowhere else: not in
prose, not in a fence, not in a standalone `[ ]` line, and not in
`- [x]no-space`. This follows ADR-0012's principle: the app's own conventions
are the ones its grammar defines.

Alternative rejected: a line regex. It would have to re-derive the grammar's
rules (list-item context, the required space), and would drift from them.

### D2: The checkbox replaces the marker and never gives way to it

`Decoration.replace` over the `TaskMarker` range, with an `atomicRanges` entry
so the caret steps over it. The widget is a native `<input type="checkbox">`.
Unlike inline markers, it does not come back as source when the selection
reaches it: the marker has exactly two states, both reachable by the control,
and a box that turned into text under the pointer would be a control that
retreats from its own click. A caret beside the marker therefore keeps the box.

Deleting a task item removes the marker too, because the atomic range is deleted
with it, and typing near it behaves as it does around any other marker: what is
typed lands in the text, not inside `[x]`.

### D3: A press is the widget's, not the editor's

The widget handles its own press (`ignoreEvent` returns `true`, the default for
widgets, stated explicitly) and writes the opposite marker in one transaction:

```ts
changes: { from, to: from + 3, insert: marker === '[ ]' ? '[x]' : '[ ]' }
```

One transaction is the whole mechanism: the normal save persists it, the normal
history undoes it, and no app-level listener or adapter hook is added. The
press does not move the selection, so a ticked item does not throw the caret
across the page; `view.focus()` keeps typing working after a press on an
unfocused document. The image control already handles its own press this way in
the same file.

Alternative rejected: a branch in the adapter's `handleClick`, beside the
reference chips. That handler maps a press to application actions (open a page,
open a board); toggling a marker is editing, and belongs on the editor side of
the ADR-0010 seam.

### D4: The widget carries no position

`toDOM(view)` receives the view, and the press resolves the marker's offset at
press time with `view.posAtDOM(box)`, which returns the start of the replaced
range. Because the widget's `eq()` therefore compares only the checked state,
CodeMirror reuses the same `<input>` element across keystrokes, and typing
anywhere on the page rebuilds no checkbox DOM.

Alternative rejected: storing the marker's offset on the widget and comparing it
in `eq()`. It looks simpler, but it makes every checkbox below the caret rebuild
on every keystroke, and the reused-element property is what keeps a long task
list cheap.

### D5: Paint follows the app's tokens

The box is 14px, brand ink through `accent-color`, no chip and no border of its
own, with the marker's own space left as the gap to the item's text. The rule
lives with the other editor-surface rules in `EditorPane.module.css` and is
recorded in `DESIGN.md` under Lists, because a task item is a list item first.

### D6: The cost on the keystroke path, measured

A scratch benchmark (Chromium, a 5,174-line page with 300 task items, two
editors side by side holding the same document, one patched) measured batches of
keystrokes with the sides swapped and pooled paired deltas, plus a control run
with the unpatched code on both sides to establish the harness's own bias:

| case | boxes in view | baseline | patched | control |
|---|---|---|---|---|
| 900px viewport, task-dense top | 64 | 0.89–0.94 ms | +0.06…+0.12 ms | +0.02…+0.07 ms |
| 9,000px window, all items visible | 300 | 3.95 ms | +0.32 ms | +0.36 ms |
| prose region, no tasks in view | 0 | 1.5–6.1 ms | not distinguishable | — |

The patched delta does not rise above the control's own bias in either case, and
the widget DOM is reused across keystrokes. Opening the 5,174-line page cost
45–90 ms in both builds. What a press adds is one three-character transaction,
which is the price of a keystroke.

## Risks / Trade-offs

- [The marker is not directly editable: a user cannot put the caret inside
  `[x]`] → It is a control, not prose, and the two states are its whole content.
  An item whose marker should go is an item the user deletes, and backspace over
  the atomic range removes the marker with it.
- [A checkbox inside `contentEditable` can grab focus and swallow typing] → The
  widget sets `contentEditable="false"`, handles its own press, and returns
  focus to the editor.
- [A widget per visible task could shrink the viewport CodeMirror can estimate]
  → The box is a fixed 14px inline element, and the measured cost is inside the
  harness noise at both realistic and absurd density (D6).
- [The reading view still shows the brackets] → Out of scope on purpose: the
  presentation renderer is a minimal static pass, and this change is the
  editor's surface.
