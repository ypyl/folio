## Why

A code block whose fence says `json` already highlights (ADR-0014), but it does not reindent: JSON pasted from a log line, an API response, or a config file stays on one unreadable line. The user can read the tokens but not the structure. Folio has no way to turn that line back into indented JSON without leaving the app.

## What Changes

- Add an on-demand **Format JSON block** command, bound to `Mod-Shift-F`, that reindents the code block the caret is in when that block's language is JSON.
- Formatting is `JSON.parse` → `JSON.stringify(value, null, 2)`: standard-library only, two-space indent, key order and values untouched.
- The command is a no-op on a block that is not JSON and on text that is not valid JSON; it never claims the chord in those cases and writes nothing.
- The command is keyboard-only for now: no toolbar button, no menu entry, no context-menu item.
- List the new row in the keyboard-shortcuts sheet so it is discoverable and replayable like every other editor chord.
- The canonical Markdown contract is unchanged: the formatted text is written back into the same ` ```json ` fence (ADR-0001/0009). No file format, no new node, no app state.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-editing`: adds a requirement that a JSON code block can be reformatted on demand from the code surface, and that the reformatted text round-trips through the fence.

## Impact

- `src/editor/codeFormat.ts` (new) holds the pure formatter and the ProseMirror command; `src/editor/milkdown.ts` gains the capture-phase chord match in its existing key handler; `src/editor/codeBlockSetup.ts` is unchanged.
- `src/components/shortcuts.ts` gains one row; `src/components/shortcuts.test.ts` gains the matching drift-guard entry.
- New unit tests for the pure formatter and for the CodeMirror command.
- No new dependency, no bundle weight: `JSON` is the platform's own.
- Extends ADR-0014 (the component code block); no new ADR. The durable decision here is small and local: JSON formatting is stdlib-only and other languages are deliberately not formatted, so no formatter dependency is taken.

## Non-goals

- **Not** formatting any non-JSON language. No Prettier, no per-language formatter, no formatter registry.
- **Not** formatting on paste, on save, or on open — only on the explicit chord. Nothing runs on the typing path.
- **Not** repairing, validating, or reporting on malformed JSON; invalid input is left exactly as it is.
- **Not** reordering keys, sorting arrays, or otherwise normalizing values; only whitespace between tokens changes.
- **Not** adding a button, menu item, or settings toggle.
