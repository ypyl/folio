## Context

See `proposal.md` for why. Facts that shape the approach:

- The code block is a `code_block` node rendered by `@milkdown/components`' component, edited through CodeMirror. Its keymap (`node_modules/@milkdown/components/lib/code-block/index.js`) binds `Mod-Enter` to `exitCode`, and its arrow keys to `maybeEscape(unit, dir)`, which at the last line resolves `TextSelection.near(doc.resolve(pos + nodeSize), 1)` — with nothing after the block, that resolves back inside the block, so the key is a no-op.
- `MilkdownAdapter` composes plugins with `.use(...)` and `$prose` from `@milkdown/utils` (`referenceBadges`, `referenceSuggest` are the precedent).
- Everything serializes through `serializerCtx`: the listener's `markdownUpdated` (verified in the installed listener source), the adapter's `serialize()`, the canonical capture inside `setContent`, and `serializeSlice` for copy-as-markdown. One `ctx.update(serializerCtx, …)` therefore covers every path.
- `setContent` captures the canonical serialization *after* dispatching the seeded doc and stores it as `seedMarkdown`, so a transaction the plugin appends during that dispatch is already part of the baseline and the echo is suppressed.
- `getBlockLines()` zips the Markdown's block anchors with `doc.childCount` and `measureNumbers` skips a block whose anchor is missing, so a trailing paragraph with no anchor costs nothing.
- The shortcut list, the reference badges' `Mod-Enter`, and the gutter all key off the document's existing shape, none of which changes.

## Goals / Non-Goals

**Goals:**

- A block to continue in always exists at the end of a page, whatever gesture the user tries.
- The vault file stays exactly what it would have been: no trailing blank line appears because of a paragraph the editor maintains.
- No new dependency, no new control, no change to how a code block is edited.

**Non-Goals:**

- No gap-cursor selection type, no change to the code block's own keymap.
- No change to `Enter`, `Mod-Enter`, or `Backspace` behavior inside a code block.
- No general "trailing paragraph after every block type": a page ending with a paragraph, a list, or a quote already offers a place to continue, and each of those exits with `Enter`.
- No change to the shortcuts reference or any other surface.

## Decisions

### D1 The invariant is a document-tail plugin, not a keybinding or a UI affordance

A `$prose` plugin with an `appendTransaction` that appends `paragraph.createAndFill()` when the document's last child is a `code_block`. It runs after every transaction, so the paragraph exists no matter how the code block arrived — typed fence, paste, copy-as-markdown, or a page opened from a file — and it terminates immediately (once the last child is a paragraph, the append never fires again).

Rejected: intercepting `ArrowDown` in the code block. It fixes one gesture, leaves clicking below the block broken, and puts a document-shape rule in a keymap.

Rejected: a `prosemirror-gapcursor` dependency. It is a new runtime dependency giving a click-only affordance, it would leave `ArrowDown` unresolved (the escape path needs a text position after the block regardless of the selection type), and it introduces a selection type the rest of the editor's code — caret-surface tracking, chord replay, reference badges — does not account for.

Rejected: a "click here to add a block" strip rendered below the last block. It invents a control the document invariant makes unnecessary, and it would have to appear for every last-block case to be consistent.

### D2 The maintained paragraph is trimmed out of the serialized Markdown

`trimTrailingBlankLines` (`/\n+$/` → a single `\n`) is applied by wrapping `serializerCtx` once in the adapter's config. Every path that produces Markdown then agrees: the change stream, `getContent()`, the seed capture, and the copy flavor.

Why the trim rather than persisting the paragraph: without it, a page ending with a code block gains a trailing blank line in the vault the first time the user edits *anything* on it — the file changes without the user changing it. The trim also removes that churn from the behaviour that exists today, where `Mod-Enter` plus typing already writes the extra blank line (measured: a seeded file `…```\n` came back as `…```\n\n`).

Rejected: appending the paragraph to the *file*. It is the same churn on every edit, and it puts a Markdown-insignificant blank line in the user's notes.

Rejected: a `filterTransaction`/serializer special case for "the paragraph the plugin appended" (tagging the node so only it is trimmed). It needs a node attribute that would itself have to be kept out of the file, for a distinction the user cannot observe: an empty trailing paragraph renders as nothing either way.

### D3 The seed and the change stream are unaffected

Because the plugin's append happens inside the `setContent` dispatch and the canonical capture reads the serialized document afterwards, the baseline the adapter stores already contains the maintained paragraph — while the serialized form still equals the file's text. So the listener's echo is suppressed as before, no change is reported, and opening a page writes nothing. The tasks verify this by watching the dirty state, not by inspecting the plugin.

### D4 What the gutter does with the extra block

Nothing: `blockStartLines` runs over the serialized Markdown, which has no anchor for a trailing empty paragraph, and `measureNumbers` skips a block whose anchor is missing. The numbers for every real block are unchanged.

## Risks / Trade-offs

- [A hand-made trailing empty paragraph is no longer saved] → Accepted and stated in the proposal: it renders as nothing, and the file keeps its canonical shape. A user who wants a blank line between blocks still gets one, since interior blank lines are untouched.
- [A file with several trailing blank lines is normalized on its next save] → Whitespace at the end of a file, on the next save only, with no rendered difference.
- [`Backspace` at the end of the maintained paragraph deletes it and the plugin re-adds it] → The delete and its join still run (the caret ends up in the code block, which is what a backwards join means); the empty paragraph returns so the place to continue stays.
- [The plugin runs on every transaction] → It reads `doc.lastChild` and appends only when that is a code block: constant work per keystroke, no traversal of the document.

## Migration Plan

None. No persisted state, no schema or file-shape migration beyond the trailing-blank-line normalization described above.
