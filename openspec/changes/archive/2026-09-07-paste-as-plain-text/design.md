# paste-as-plain-text — Design

## Context

See proposal.md — Why. The editor is Milkdown v7 mounted in `MilkdownAdapter` (`src/editor/milkdown.ts`) with `commonmark` + `listener` + `history`. Paste today runs ProseMirror's default HTML path through the schema's `parseDOM` (strong, emphasis, inline-code, and link all parse from HTML), so rich web copies plant invisible marks and links into canonical files. The adapter exposes the `EditorAdapter` seam (ADR-0010); the only paste surface is the ProseMirror `EditorView`, which accepts editor props — including `handlePaste` — from the Milkdown `editorViewOptionsCtx` slice (verified: core passes that slice straight to the `EditorView` constructor).

## Goals / Non-Goals

**Goals:**
- All pastes insert only the clipboard's plain text, literally, with no interpretation and no HTML-derived formatting.
- The change lives entirely inside `MilkdownAdapter` — the React layer and the `EditorAdapter` interface stay untouched.
- Pasted text round-trips: identical literal text after save + reopen.

**Non-Goals:**
- No markdown interpretation of pasted text (rejected Option B).
- No paste-of-files handling (copied files keep today's no-op behavior).
- No change to typing input rules.

## Decisions

**1. Hook: `handlePaste` via `editorViewOptionsCtx` in the adapter's `.config()`.**
The mount already calls `.config()`; add an update to `editorViewOptionsCtx` that supplies `handlePaste`. Alternative considered: a `$prose` plugin wrapping the view — more machinery for the same result, and editor-view props are the intended seam for event interception (the commonmark preset itself relies on these props).

**2. Insert the raw string, don't parse it (Option A).**
`handlePaste(view, event)` reads `event.clipboardData.getData('text/plain')`; if empty, return `false` (fall through to default — preserves today's behavior for copied files). Otherwise replace the selection with the raw string (`tr.insertText`). Alternative considered: round-trip the text through `parserCtx` (Option B, what drops already do via `insertMarkdown`) — rejected because real clipboards (Slack, chat apps, code/log copy) carry literal `**`/`*` markers the user does not want interpreted, and because interpreting creates formatting users cannot see coming.

**3. The escape guarantee is what keeps the file canonical.**
Inserting literal `**wow**` creates a text node whose serializer output (remark-stringify, the final stage of the Milkdown serializer) escapes markdown-significant runs: the file gets `\*\*wow\*\*`, which re-parses to the same literal text. This is the "remains literal after save and reopen" behavior the spec requires — the escaping is implementation detail, invisible in the editor view.

**4. Multi-line paste inserts as one text node with preserved line breaks.**
The schema's text node accepts `\n`; a raw insert keeps the breaks, and the serializer writes them back as soft line breaks, which re-parse identically. If a round-trip test shows the preset's hardbreak filter plugins interfering (`\n` → hardbreak → serialized as escaped backslash), fall back to splitting the pasted text into segments at `\n` and inserting them as separate paragraphs. The spec ("line breaks preserved") holds under both; the test decides.

**5. No interface change.**
`handlePaste` is internal to the adapter; `EditorAdapter` and `EditorPane` are untouched. New tests go in `src/editor/milkdown.test.ts` alongside the existing round-trip tests.

## Risks / Trade-offs

- [Pastable rich content loses formatting] → Intended. The spec contracts literal insertion; typing remains the only formatting path.
- [Multi-line insert round-trips as hard breaks, polluting files] → The change's tests pin soft-break round trip; the paragraph-split fallback above is the mitigation if it fails.
- [Escaped asterisk noise in `.md` files when pasting markdown-looking text] → Accepted cost of Option A; it is the honest canonical result (an unescaped `**` would re-bold on reload). Only text that contains real markdown syntax triggers it.
- [Clipboard had only an HTML fragment (no text/plain)] → `text/plain` is empty; return `false`, default path already yields nothing the user wants.

## Open Questions

None — the multi-line subdivision is resolved by a test, not a user decision.