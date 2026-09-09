# paste-as-markdown — Design

## Context

See proposal.md — Why. The editor is Milkdown v7 inside `MilkdownAdapter` (`src/editor/milkdown.ts`); its `handlePaste` reads `text/plain` and inserts it literally via `tr.insertText`, and the serializer escapes Markdown-significant runs so files stay canonical (ADR-0001). Node-based insertion already exists: `insertMarkdown` parses `parserCtx(markdown)` and replaces the selection (the path asset drops use). Pasts aimed inside a code block already yield to the CodeMirror surface (`.cm-editor` check). The `EditorAdapter` seam (ADR-0010) has no paste surface today; this design keeps it that way.

## Goals / Non-Goals

**Goals:**
- A pure, testable markdown-likeness check over `text/plain`, plus paste routing in the adapter that interprets qualifying text as real nodes.
- Interpretation via the existing parse path; HTML fragments remain ignored (the original formatting-pollution fix stands).
- A shift-modifier force-literal branch; the shortcuts dialog documents it.
- No change to the `EditorAdapter` interface or the React layer.

**Non-Goals:**
- No GFM/tables or task-list checkboxes (schema limit; pasted content degrades gracefully).
- No per-paste UI toggle, no force-parse gesture, no typing-input-rule changes.

## Decisions

**1. Text/plain stays the only clipboard input; only the interpretation stance changes.**
The archived `paste-as-plain-text` change solved two things — ignoring HTML fragments (keep) and never interpreting Markdown (reverse). Parsing plain text through `parserCtx` (same path as seeds and drops) is unrelated to the `parseDOM` HTML path that planted invisible marks, so reversal does not reopen the original problem.

**2. One pure gate: `looksLikeMarkdown(text)`.**
Signals are line-start block markers only — ATX heading `#{1,6} `, blockquote `> `, unordered `[-*+] `, ordered `\d+[.)] `, table row `|`, thematic break (`---`/`***`/`___`), fence opener (``` / `~~~`). Parse iff a fence opener appears **or** ≥2 signal lines AND signal lines are ≥50% of non-blank lines. Inline markers (`**`, `*`, backticks, links) are not signals, so Slack-style copies stay literal; a lone `# Title` needs a second signal (corroboration), protecting `# comment` lines pasted from code. Alternatives rejected: parse-always (misfires on prose with stray markers), gesture-only (contradicts "automatically"), blocks-only skeleton (re-creates escapes for `**bold**` inside paragraphs).

**3. Interpretation is wholesale (blocks + inline).**
A qualifying paste is parsed in full: headings, lists, blockquotes, fences, and inline emphasis/links all become real nodes. A blocks-only parse would leave `**bold**` literal, which re-escapes on save — the exact pain this change removes.

**4. Insertion reuses and extends the drop path.**
Extract the selection-replacement logic from `insertMarkdown` into a private helper both paste and drops call: single-inline-paragraph payloads keep the existing "drop the wrapper paragraph" handling; multi-block payloads insert the parsed fragment (whole-doc node) at the selection, letting ProseMirror split surrounding text as needed. Round-trip normalization is accepted: tables degrade to literal pipe lines (no GFM schema), `- [x]` keeps literal `[x]` inside a real list item, and syntax normalizes to the schema's dialect while semantics are preserved.

**5. Force-literal is the shift modifier on the same handler.**
The `handlePaste` branch checks `event.shiftKey` combined with ctrl/meta before the sniff: `Mod+Shift+V` inserts `text/plain` verbatim through the existing literal path. This keeps the universal "shift-v = plain text" convention meaningful under a markdown-aware default. No new keymap; the shortcut is added to `shortcuts.ts` for the dialog.

## Risks / Trade-offs

- [YAML/config with `#` comments and `- ` items pasted bare onto a page gets partially interpreted (comments become headings)] → Rare (code is normally pasted into a fence, where verbatim paste already applies); recover via Undo or `Mod+Shift+V`.
- [Lone `# Title` paste stays literal and escapes in the file] → Accepted: it protects `# comment` lines; typing a heading is trivial.
- [Mid-sentence block paste splits the surrounding paragraph] → Standard ProseMirror block-paste mechanic; undoable.
- [Existing escaped content (`sample/todo.md`) is not repaired by this change] → Out of scope; re-paste or hand-fix.
- [A single quoted/fenced line can trigger interpretation] → Fence openers are unambiguous in practice; the density rule still guards the rest.

## Migration Plan

Behavior-only change: no data migration, no storage changes. Canonicality holds (ADR-0001) — files written after a markdown-aware paste contain real structure instead of escaped literals, and re-parse identically. Rollback is a one-line revert of the `handlePaste` routing; the literal path remains intact and exercised by the force-literal branch.

## Open Questions

None — the sniff rule and its edge cases are pinned in the spec; remaining unknowns (exact signal set tuning) are test-revealed and do not change the approach.