# paste-as-plain-text

## Why

The editor has no clipboard plugin, so paste runs ProseMirror's default HTML path through the schema's `parseDOM`: web copies with `<b>`, `<em>`, `<code>`, or `<a>` plant invisible formatting — bold/italic/code marks and links that have no visible markers and no convenient way to strip (links have no keymap at all, and the app has no clear-formatting command). The folder is the database (ADR-0001); formatted text the user never asked for silently lands in canonical files where it cannot be un-formatted without hand-editing the `.md`.

## What Changes

- Paste reads the clipboard's plain text (`text/plain`) only and inserts it **literally** — no HTML fragment, no `parseDOM` formatting, no Markdown interpretation. Pasted `**wow**` stays literal (written to the file escaped as `\*\*wow\*\*` so a reload re-parses it back to the same literal text).
- Multi-line pasted text keeps its line breaks; pasted URLs stay literal text.
- Paste events carrying no text (e.g. copied files) fall through to the current behavior.
- Typing is unaffected: the Markdown input rules still turn `**x**` into bold as the user types. The rule becomes: *the editor interprets the Markdown the user types; paste is the user's text, verbatim.*

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-editing`: paste behavior in the editor changes from formatting-preserving HTML insertion to literal plain-text insertion, with no Markdown interpretation.

## Impact

- `src/editor/milkdown.ts` — `MilkdownAdapter` gains a `handlePaste` override via `editorViewOptionsCtx` (an existing Milkdown v7 configuration hook that passes editor props straight to the ProseMirror `EditorView`). No new dependencies.
- `src/editor/milkdown.test.ts` — new tests for formatted HTML paste → plain text, literal `**x**` paste → escaped round trip, multi-line paste, and no-text fall-through.
- Consistent with ADR-0008 (editor choice) and ADR-0010 (editor behavior lives in the editor layer, behind the `EditorAdapter` seam). No new ADR needed.
- No observable change to the `EditorAdapter` interface (`paste` is handled inside the adapter).

## Non-goals

- No clear-formatting command or formatting toolbar (handled separately, if ever).
- No Markdown interpretation of pasted text (Logseq-style "paste as Markdown" is explicitly rejected).
- No paste-as-HTML option, no clipboard plugin.
- No change to how typing creates Markdown formatting.