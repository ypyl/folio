## Context

See `proposal.md` for why. Facts that shape the approach:

- The document tail is already a `$prose` `appendTransaction` plugin (`documentTail` in `src/editor/documentTail.ts`) that appends `paragraph.createAndFill()` when the last child is a `code_block` or `table`, and `trimTrailingBlankLines` (`/\n+$/` → a single `\n`) wraps `serializerCtx` so that paragraph never reaches the file. This change generalizes the first and keeps the second.
- `setContent` captures the canonical serialization *after* dispatching the seeded doc and stores it as the baseline, so a paragraph the plugin appends during that dispatch is already part of the baseline and the listener's echo is suppressed. Opening a page therefore writes nothing today, and keeps doing so.
- The line-number gutter zips the Markdown's block anchors with `doc.childCount` and skips a block whose anchor is missing, so a trailing paragraph that the trim removes from the Markdown costs no number.
- The AGENTS.md keystroke budget: an `appendTransaction` runs per transaction, so its condition must be constant work and must not allocate except on the append path.
- ADR-0001/0009: Markdown stays canonical; a paragraph kept only for editing must not become part of the file. ADR-0010: this is editor-layer behavior.

## Goals / Non-Goals

**Goals:**

- A blank line to continue on is always visible at the end of an open page or journal, whatever the last block is.
- At most one such paragraph exists; it never accumulates and the document does not grow per keystroke.
- The vault file is byte-for-byte what it is today: a single trailing newline, no blank lines.
- Constant work per keystroke.

**Non-Goals:**

- No gap cursor or new selection type, no click-to-add control.
- No change to `Enter`, `Backspace`, or `Mod-Enter` inside a code block.
- No change to the gutter's numbers, the shortcuts reference, or the persisted file shape.

## Decisions

### D1 Generalize the plugin condition, keep the plugin

The condition changes from "last child is a `code_block` or `table`" to "last child is not an empty paragraph": append `paragraph.createAndFill()` unless the document already ends with an empty paragraph. `CLOSED_TAIL` and the block-type-specific case disappear. Everything about the mechanism stays: it is an `appendTransaction`, so the paragraph is there however the last block arrived (typed, pasted, or opened from a file), and it terminates as soon as the last child is an empty paragraph, so it never accumulates.

Rejected: a keymap on `Enter`/`ArrowDown`. It fixes some gestures and leaves others (a click below the block) broken, and puts a document-shape rule in a keymap. This was already rejected in `edit-after-trailing-code-block` and the reasoning is unchanged.

Rejected: rendering a click target below the document. It invents a control the document invariant makes unnecessary and would have to appear for every last-block case to be consistent.

### D2 The paragraph stays an editor concern, trimmed out of every serialization

`trimTrailingBlankLines` is unchanged and still wraps `serializerCtx` for the change stream, `getContent()`, the seed capture, and the copy flavor. Persisting the paragraph instead would add a trailing blank line to the vault on the first edit of any page, a file change the user did not make, and would put a Markdown-insignificant blank line in the user's notes.

Rejected: tagging the appended node so only *it* is trimmed. It needs a node attribute that then has to be kept out of the file, for a distinction the user cannot observe: an empty trailing paragraph renders as nothing either way.

### D3 Opening a page still writes nothing

The append happens inside the `setContent` dispatch and the baseline is captured from the serialized document afterwards, so the maintained paragraph is part of the baseline while the serialized form still equals the file's text. Dirty state stays clean and no write is triggered. Verified by watching the dirty state, not by inspecting the plugin.

### D4 The gutter is unaffected

The trimmed Markdown has no anchor for the trailing empty paragraph, and `measureNumbers` skips a block whose anchor is missing, so the numbers on every real block are unchanged and the trailing line shows no number. The design assumes the serialization holds no anchor for it; a test asserts the numbers are unchanged when the tail is present.

### D5 The tail survives deletion and undo

`Backspace` at the start of the tail paragraph joins it into the block above, and the plugin re-appends it on the resulting transaction, so the line to continue on is always there. Undo of a user edit lands on a document whose last block is not an empty paragraph whenever text remains, so the plugin re-derives the tail rather than leaving the document without one. The intended outcome: one undo reverses one user edit, and the tail is never permanently removed.

### D6 The write-path guard added in 0.6.1 is removed

`ensureTrailingNewline` in `src/vault/index.ts` (0.6.1) duplicates what `trimTrailingBlankLines` already guarantees on every serialization, and it is the only normalization on the write path. It is removed so there is exactly one place that decides the file's tail.

## Risks / Trade-offs

- [The document carries one block more than the file] → Serialization trims it; no rendered difference and no file change.
- [The last empty line cannot be deleted] → Accepted: it is the invariant. `Backspace` at its start joins into the block above and the line returns.
- [The plugin now runs its append path on ordinary editing, not only after code blocks and tables] → The condition is a last-child check, constant per transaction; `createAndFill` allocates only when a paragraph is actually appended, which is once per shape change, not once per keystroke.
- [A blank page] → A document with a single empty paragraph is already a valid tail, so no second paragraph is added and the file is unchanged.
- [Undo could take two steps if the appended paragraph became its own history event] → Verified in tasks (an undo test and a browser check), not assumed.
- [Copy-as-markdown could pick up the tail] → It serializes through the same trimmed path, so it carries no trailing blank line.

## Migration Plan

None. No persisted state changes; the file shape is unchanged.
