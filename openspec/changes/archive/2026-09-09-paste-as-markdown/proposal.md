# paste-as-markdown

## Why

Pasting a Markdown document into a page inserts it as literal text: every Markdown-significant run gets escaped on save (`#` → `\#`, `**` → `\*\*`, `1.` → `1\.`, fences → `` \`\`\` ``), so the pasted content lands in the `.md` file as a wall of backslash escapes instead of real structure. Observed in practice: pasting a Markdown sample into `sample/todo.md` produced a page of escaped literals. Folio's editor already interprets the Markdown the user *types* (typing `# x` makes a heading); paste is the one path where Markdown-looking text stays escaped — inconsistent, and unusable for moving documents between Markdown tools. The pasted content should become part of the page's Markdown, the same as if it had been typed.

## What Changes

- Paste becomes **markdown-aware**: plain paste reads the clipboard's plain text (HTML fragments stay ignored — the formatting-pollution fix from the archived `paste-as-plain-text` change is untouched) and, when the text resembles a Markdown document, interprets it into the document — headings, lists, blockquotes, code fences, emphasis, links — instead of inserting escaped literal text.
- Interpretation is rule-based, not arbitrary: parse when any line opens a fenced code block, **or** when at least two non-blank lines start with block-level Markdown markers (ATX heading, blockquote, list item, ordered item, table row, thematic break) **and** those lines make up at least half of the non-blank lines. Inline-only markers (`**x**`, `` `x` ``, links) never trigger interpretation by themselves.
- A lone heading line (`# Title`) pasted alone stays literal — single-signal text never triggers interpretation.
- **Mod+Shift+V (Ctrl+Shift+V) always pastes plain text verbatim**, bypassing the interpretation rule.
- Paste aimed inside a code block stays verbatim (unchanged; the CodeMirror surface owns it).
- This **reverses the recorded stance**: the archived `paste-as-plain-text` change explicitly rejected "Logseq-style paste as Markdown". Its *Why* was HTML-fragment formatting pollution; interpreting plain text through the parser does not reopen that problem. The main spec requirement "Paste inserts only the plain text of the clipboard" is amended accordingly (delta spec).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-editing`: paste behavior changes from literal-only to markdown-aware (block-structure sniff + interpretation) with a force-literal shortcut; the code-block requirement's outside-a-code-block paste scenario is amended to match.

## Impact

- `src/editor/milkdown.ts` — `MilkdownAdapter.handlePaste` routes `text/plain` through the markdown-likeness check; interpretation reuses the existing `parserCtx` path already used by drops (`insertMarkdown`). The `EditorAdapter` seam is unchanged.
- New pure, unit-testable sniff function (no editor coupling); tests in a new unit test file plus paste-path tests in `src/editor/milkdown.test.ts`.
- `src/components/shortcuts.ts` — the shortcuts dialog gains "Paste as plain text" (Mod+Shift+V).
- No new dependencies. No new ADR: ADR-0008 (Milkdown editor) and ADR-0010 (editor-vault separation) hold; ADR-0001 (Markdown canonical) still holds — written files remain canonical, now with real structure instead of escaped literals. The reversal is captured in the spec delta and this proposal, not an ADR.

## Non-goals

- No GFM preset: pasted tables degrade to literal pipe lines; `- [x]` task items keep `[x]` as literal text inside a real list item.
- No force-parse gesture (the inverse override); if the lone-heading policy ever annoys, a later change can add it.
- No change to typing input rules; typed Markdown formats exactly as today.
- No HTML-fragment paste path; rich web copies still paste as plain text.
- No byte-identical round trip: pasted content is parsed and re-serialized (normalized), not copied verbatim.
- Already-escaped content in existing files (e.g. the `\#` lines in `sample/todo.md`) is not retroactively repaired.