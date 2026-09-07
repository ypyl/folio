# ADR-0014: Adopt the Milkdown component code block (CodeMirror)

- Status: Accepted
- Date: 2026-09-07

## Context

Code blocks in Folio's editor (ADR-0008) round-tripped correctly as Markdown but rendered as unstyled `pre>code`: the inline-code rule leaked a pill-shaped fill onto every line, there was no language support, no highlighting, and no way to set a language. The Milkdown playground ships a component that replaces the code-block node view with a CodeMirror 6 editor — language picker, syntax highlighting, line numbers, completion, folding, search/replace. Users expect blocks to look and behave like that. The decision is whether to adopt that component, trading a measurable dependency and bundle cost against a fully-featured, upstream-maintained code surface.

## Decision

Adopt `@milkdown/components/code-block` (7.22.x, same line as the existing `@milkdown/core`), registered on the existing classic-package editor chain via `.use(codeBlockComponent)` plus a `codeBlockConfig` supplying `basicSetup`, the `@codemirror/language-data` catalog, and a custom CodeMirror theme built from the Folio design tokens (DESIGN.md `Code`; ADR-0011). The on-disk Markdown contract is untouched: the `code_block` node, its `language` attribute, and the ` ```lang ` fence serialize exactly as before (ADR-0001/0009).

Accepted costs: `@milkdown/components` depends on **Vue 3** and pulls `@milkdown/preset-gfm`, `plugin-diff`, and `plugin-tooltip`; the CodeMirror stack and language catalog add further weight. This runs against the keep-it-small guardrail of ADR-0006, accepted deliberately because the component is the requested feature (a hand-rolled CodeMirror wrapper would reimplement it), and the language catalog is lazy — only languages actually used fetch their grammar chunk.

## Consequences

- Code blocks gain the playground's editing features with upstream maintenance; Folio supplies only the theme and the pane stylesheet.
- Bundle weight rises (Vue + CM + language-data). The production bundle must be measured (build task) before accepting the final number; if it proves egregious, the design's fallback is trimming the `basicSetup` extension set, not dropping the component.
- Paste is special-cased: the editor's paste-as-plain-text view prop yields when the paste target is inside `.cm-editor`, so CodeMirror owns pastes inside blocks while everything else stays verbatim plain text.
- The editor's own undo/redo does not reach code-block-local history (CodeMirror keymaps own Mod-z inside a block) — matches the playground's behavior.
- Test seam: jsdom lacks `IntersectionObserver`, which the component's node view requires to mount; the smoke test stubs it.