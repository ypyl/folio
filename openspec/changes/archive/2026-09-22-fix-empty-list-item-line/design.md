## Context

Milkdown's commonmark preset serializes an empty paragraph as `<br />` (its
`remarkPreserveEmptyLine` pair). A list item's blocks are written tight — no blank line
between them — so an item whose content is `[empty paragraph, code block]` serializes as:

```
* <br />
  ```
  SELECT *
  ```
```

Re-parsing that, the line in the item's content that begins with `<br />` starts a
CommonMark HTML block that runs to the next blank line, swallowing the fence. The model
comes back as one inline `html` atom holding the whole run, and Folio renders an `html`
node as literal text (`htmlSchema.toDOM` builds a `<span>`). See `proposal.md`.

The fix sits at the editor's Markdown boundary, the same place `trimTrailingBlankLines`
already normalizes the document tail (`src/editor/documentTail.ts`).

## Goals / Non-Goals

**Goals**

- An empty list item holding a child block round-trips, and files already written broken
  are read back correctly.
- One pure, tested string helper applied on both the write and read sides.

**Non-Goals**

- Changing the `<br />` representation itself, or touching empty paragraphs outside list
  items.
- Rewriting vault files on open; repair reaches disk through the ordinary save.

## Decisions

### D1. A pure `separateEmptyListLines(markdown)` helper

Inserts a blank line after a list-item line whose whole content is a `<br>` when the next
line is **more indented** (a child block of that item). It skips fenced code blocks and
leaves a next line that is blank or at the same indent alone. Alternatives:

- **Override the paragraph serializer** to omit `<br />` for a list-item's first block —
  rejected: `toMarkdown` sees the node without its parent, so it cannot tell a list item
  from any other empty paragraph without scanning the whole document.
- **Set `spread: true` on the list item** in a ProseMirror transform — works, but mutates
  the live document on load (dirty state, extra transaction) for what is a text-encoding
  concern.
- **Only patch Backspace** — rejected: leaves the code block degrading to raw HTML on
  reload.

### D2. Apply it on both sides of the boundary

- **Write**: every serialization path — the `markdownUpdated` listener's canonical value,
  `serialize()`, `serializeSlice()`, and the canonical capture in `setContent()`.
- **Read**: every parse path — `setContent()` and `insertParsedMarkdown()` (paste and
  drop) — by normalizing the Markdown before `parserCtx`. This is what repairs an
  already-broken file: the blank line makes the parser build `[empty paragraph, code
  block]` again.

### D3. One helper beside `trimTrailingBlankLines`

A new `src/editor/emptyLines.ts` exports the helper and `src/editor/milkdown.ts` wraps its
existing `trimTrailingBlankLines(...)` calls with it (`trimTrailingBlankLines(separateEmptyListLines(x))`).
Keeping it out of `documentTail.ts` keeps that module about the trailing paragraph.

### D4. Backspace reuses the existing keydown listener

The adapter already intercepts keys in a capture-phase listener for Delete. Backspace's
case removes the empty item and promotes its children in one transaction (insert the
children after the item's list, delete the item, delete the list when it becomes empty,
place the caret at the end of the previous text). See the deleted paragraph on why
`liftListItem`/`joinForward` do not give this result.

## Risks / Trade-offs

- **[String transform misfires]** A code sample or unusual Markdown could be altered. →
  The helper only acts on a list-item line that is exactly `<br />`, only when the next
  line is more indented, and never inside a fenced code block; tests cover each.
- **[Loose vs tight lists]** Inserting a blank line makes the item loose. → That is the
  encoding the parser needs, and it is what the parser produces from a correct file, so
  save/open/save is stable.
- **[Backspace promotion is structural]** Moving children could lose content. → The
  children are inserted before the item is deleted, in one transaction and one undo step;
  a test asserts the code block survives.

## Migration Plan

Existing broken pages self-heal: opening one normalizes the Markdown in memory, and the
next ordinary save writes the separating blank line. No batch migration and no file is
rewritten without a user edit.
