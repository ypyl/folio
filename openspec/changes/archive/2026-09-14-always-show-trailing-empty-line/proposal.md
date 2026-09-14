## Why

A page whose last block is a paragraph, a list, or a quote offers no visible line to continue on: the caret can only land inside text that already exists. The editor already maintains an empty paragraph after a trailing code block or table for this exact reason (see the archived `edit-after-trailing-code-block`), but every other page shape renders its last block flush against the bottom with nothing after it. Users want a place to continue, always visible, at the end of every page and journal.

## What Changes

- Generalize the document-tail invariant: an open page always holds an empty paragraph after its last block, so a blank line is always visible at the end and a click or `ArrowDown` past the last block lands the caret there.
- The maintained line stays an editor concern. It is trimmed from every serialization, exactly as today, so the vault file still ends with a single newline and the maintained paragraph never reaches disk. Opening a page still writes nothing.
- The existing "after a trailing code block or table" rule is subsumed by the general rule; no block-type-specific case remains.
- No new dependency, no new control, no change to the file format or the vault contract.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-editing`: the requirement that keeps a block after a trailing code block becomes a requirement that an empty paragraph always ends the document (whatever the last block is), and the serialization requirement keeps its "single trailing newline, no blank lines" rule now that the maintained paragraph is always present.

## Non-goals

- No change to what lands in the vault file: still a single trailing newline, no trailing blank lines.
- Not a gap cursor, a new selection type, or a "click here to add a block" strip.
- No change to `Enter`, `Backspace`, or `Mod-Enter` behavior inside code blocks.
- No change to the line-number gutter's numbers.
- The trailing line is not made a saved block: a user still cannot persist a blank line at the end of the file.
