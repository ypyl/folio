## Why

Code blocks are the one editor surface that reads as broken: they insert fine, but render as stacks of inline-code pills with no block styling, no language label, and no way to set a language. Users coming from the Milkdown playground (or any real Markdown editor) expect a fenced block they can type multiple lines into and, ideally, syntax highlighting. Folio needs code blocks that look and behave like code blocks, while keeping the Markdown canonical on disk.

## What Changes

- Replace the editor's `code_block` node rendering with the `@milkdown/components/code-block` component — a CodeMirror-backed editing surface inside code blocks.
- Code blocks gain the component's built-in features: a language picker, syntax highlighting, line numbers, auto-completion/folding, and search-and-replace (via a CodeMirror basic setup).
- Syntax highlighting uses a **custom CodeMirror theme built from the Folio design tokens** (`DESIGN.md` Code section: keyword `--brand`, comment `--stone`, string `--olive`, number `--dark-warm`), not the docs' `oneDark`; blocks without a language stay monochrome.
- The language chosen in the picker round-trips through the Markdown fence (` ```js ` … ` ``` `) exactly as today — the on-disk format is unchanged.
- Pasting *inside* a code block is handled by the CodeMirror surface (multiline, indentation preserved); the editor-wide paste-as-plain-text rule is untouched outside code blocks.
- Existing entry rules keep working: typing ` ``` ` + space/Enter or pressing `Mod-Alt-c` still opens a code block (which now mounts the CodeMirror surface).
- `DESIGN.md`'s Code section is updated to describe the component-backed block (ivory fill, token highlighting, language label) instead of a described-but-unimplemented scheme.

No **BREAKING** changes: Markdown stays canonical (ADR-0001/0009), the serializer contract is unchanged, and existing fenced blocks keep round-tripping.

## Capabilities

### New Capabilities

(none — the behavior change lives in the existing editor capability)

### Modified Capabilities

- `page-editing`: the "open page is edited in place" requirement gains code-block-specific behavior — code blocks are a CodeMirror editing surface with a language picker and token-based highlighting; language, multiline content, and fences round-trip to Markdown; pasting inside a code block is handled by the code block itself.

## Non-goals

- **No new entry affordances** (toolbar button, slash menu): keyboard entry (` ``` `, `Mod-Alt-c`) stays as-is. Fixing the editor-focus-on-open gap is a separate change.
- **No custom language registry** beyond `@codemirror/language-data` defaults, and no user-defined themes or theme switching.
- **No change to the paste-as-plain-text rule outside code blocks** (page-editing requirement stays intact).
- **No styling framework**: the component ships no CSS; all visual treatment comes from Folio tokens in the existing editor stylesheet, per ADR-0011.
- **No block-based document model** (ADR-0009): the component renders existing ProseMirror `code_block` nodes; the document model is untouched.

## Impact

- **Editor adapter** (`src/editor/milkdown.ts`): register `codeBlockComponent`; verify/adapt the custom `handlePaste` so pastes targeting a code block reach CodeMirror instead of being intercepted; confirm `setContent`/seed-echo and `onChange` still behave with mounted CodeMirror instances.
- **Dependencies (new)**: `@milkdown/components` (7.22.x), `@codemirror/language-data`, `@codemirror/state`, `@codemirror/view`, `@codemirror/language`, `@codemirror/commands`, plus the `codemirror` meta-package for `basicSetup`. Note: `@milkdown/components` itself depends on **Vue 3** and pulls `@milkdown/preset-gfm`, `plugin-diff`, and `plugin-tooltip` — a measurable bundle cost that runs against ADR-0006's keep-it-small guardrail.
- **Styling** (`src/components/EditorPane.module.css` + `DESIGN.md`): block `pre`/`code` treatment replacing the inline-code pill leak; Folio-token CodeMirror theme; language-label styling.
- **Specs**: `openspec/specs/page-editing/spec.md` gains a code-block component requirement.
- **ADR**: a new `adr/0014-*.md` is warranted to record adopting the component stack and accepting its dependency/bundle cost (supersedes nothing; complements ADR-0008/ADR-0011). DRY note: ADR numbering continues from 0013.