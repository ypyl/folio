# paste-as-markdown — Tasks

## 1. Sniffer: pure markdown-likeness check

- [x] 1.1 Implement `looksLikeMarkdown(text: string): boolean` (new module, no editor coupling — e.g. `src/editor/markdownLike.ts`): line-start block signals (ATX heading `#{1,6} `, blockquote `> `, unordered `[-*+] `, ordered `\d+[.)] `, table row `|`, thematic break `---`/`***`/`___`, fence opener ``` / `~~~`); returns true iff a fence opener appears, or ≥2 signal lines AND signal lines ≥ half of non-blank lines; inline markers and blank/whitespace-only lines never count. Verify: `npm run lint` passes and the new unit tests in 1.2 are green.
- [x] 1.2 Unit tests for `looksLikeMarkdown` covering: a full document like the `sample/todo.md` paste (heading + lists + blockquote + fence — parse), a plan-style doc (headings + task lists — parse), a lone 10-bullet list (parse), `**wow**` inline-only (literal), a chat transcript with one stray `- ` line (literal), a lone `# Title` line (literal), fence-only text (parse), empty string (literal). Verify: all assertions pass.

## 2. Adapter paste routing

- [x] 2.1 In `MilkdownAdapter.handlePaste` (`src/editor/milkdown.ts`): after the `.cm-editor` code-block yield, read `text/plain`; when the paste event carries the shift modifier with ctrl/meta — verbatim literal insert (existing `tr.insertText` path); otherwise when `looksLikeMarkdown(text)` — parse and insert nodes; else the existing literal path. Extract the selection-replacement logic from `insertMarkdown` into a private insertion helper shared by paste and drops (preserving the single-inline-paragraph handling and adding multi-block fragment insertion via the parsed doc node). Verify: `npm run lint` and `npm run build` pass; code-block-yield and no-text fall-through behavior unchanged by review.
- [x] 2.2 Add "Paste as plain text" (Mod+Shift+V) to `SHORTCUT_GROUPS` in `src/components/shortcuts.ts`. Verify: the shortcuts dialog lists the entry and its tests stay green.

## 3. Paste behavior tests (jsdom, real adapter)

- [x] 3.1 Markdown-document paste test: dispatch a paste whose `text/plain` is a multi-block document (heading + bullets + fence); assert the serialized content contains the unescaped heading and structure (no `\#`/`\-` escapes), the fenced block mounts the code surface, and setContent round-trips to the same structure (spec: "A Markdown document pastes as structure").
- [x] 3.2 Literal-path regression: existing tests stay green (`**wow**` literal round trip, multi-line paste, no-text paste); add a lone `# Title` paste test asserting it stays non-heading text (spec: "A lone heading line stays literal").
- [x] 3.3 Force-literal test: dispatch a paste of a markdown-lookalike document with the shift+ctrl modifier; assert the result matches today's literal path (spec: "A shift-modifier paste forces literal text").
- [x] 3.4 Fence-in-paste covered by 3.1; confirm the code-block surface mounts and the existing code-block paste verbatim test still passes (spec: "Pasting inside a code block is handled by the code surface").

## 4. Integration checks

- [x] 4.1 Run `npm test`, `npm run lint`, and `npm run build`; verify all paste tests pass and no existing suite regresses. Then manually verify in the running app: paste Plan-like content onto a page from the sample vault and confirm real structure appears in the saved `.md` file with no escape backslashes; confirm `Mod+Shift+V` of the same content inserts it literally.