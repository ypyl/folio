## 1. Spike: component integration

- [x] 1.1 Add dependencies (`@milkdown/components`, `codemirror`, `@codemirror/language-data`, `@codemirror/commands`, `@codemirror/state`, `@codemirror/view`, `@codemirror/language`) and verify `npm install` succeeds and `npm ls` shows a consistent 7.22.x editor stack
- [x] 1.2 In a throwaway harness, register `codeBlockComponent` on the existing classic-package editor chain and verify: a ` ``` `-created block mounts the CodeMirror surface, and pasting inside it keeps multiline/indentation (if classic imports break the component, try the `@milkdown/kit` wiring and record which works in design.md)

## 2. Editor wiring

- [x] 2.1 Wire `codeBlockComponent` + `codeBlockConfig` into `src/editor/milkdown.ts` and verify in the running app that creating a code block renders the CodeMirror surface with caret inside (page-editing: inserting opens the surface)
- [x] 2.2 Update the adapter's `handlePaste` to yield to CodeMirror when the paste target is inside `.cm-editor`; verify pasting multi-line indented text inside a code block lands in the block, and pasting outside a code block is still verbatim plain text (page-editing: paste scenarios)

## 3. Theme and styling

- [x] 3.1 Create `src/editor/codeBlockSetup.ts` exporting `basicSetup`, `keymap.of(defaultKeymap)`, `languages` from `@codemirror/language-data`, and a Folio-token `HighlightStyle`/theme (values commented with their DESIGN.md token names); verify a language block highlights with `--brand`/`--stone`/`--olive`/`--dark-warm`/`--near-black` and a language-less block stays monochrome
- [x] 3.2 In `EditorPane.module.css`, add block `pre`/`code` styling (ivory fill, no per-line pill padding) and scope the inline-code rule so it no longer styles block code; verify against DESIGN.md Code section and the language label in the CM surface

## 4. Round-trip and spec coverage

- [x] 4.1 Add/extend the milkdown smoke test: `setContent` with a ` ```js ` fence renders, serializes back unchanged, and the seed-echo guard does not misfire on mounts (round-trip regression)
- [x] 4.2 Walk the page-editing delta scenarios and verify each observable behavior (insert via ` ``` ` and `Mod-Alt-c`, multiline persistence, language round-trip through the fence, monochrome language-less blocks, paste inside/outside code blocks) — record the outcome

  Outcome (verified live in Chromium against the running app + harness):
  - Insert via ` ``` `+Enter and via `Mod-Alt-c` both open the CodeMirror surface with the caret inside ✓
  - Multiline typing stays in the block and saves inside the fence ✓
  - Picking "Python" in the language picker writes ` ```Python ` to the saved file; reload re-parses it ✓ (note: the picker stores the display name, e.g. `Python`, matching the component's own behavior — lowercase aliases typed by hand also round-trip)
  - Language-less blocks render monochrome (zero highlight spans) ✓
  - Pasted multi-line indented text inside a block lands in CM with lines/indentation preserved; pasting outside stays verbatim plain text (milkdown paste tests) ✓

## 5. Docs and build

- [x] 5.1 Update `DESIGN.md`'s Code section to describe the component-backed code block (ivory fill, token highlighting, language label) and its token mapping
- [x] 5.2 Write `adr/0014-adopt-milkdown-code-block-component.md` (decision: adopt `@milkdown/components` + CodeMirror; accept the Vue 3 and plugin dependencies and bundle weight; reference ADR-0008/0011/0006) and add the row to `adr/README.md`
- [x] 5.3 Run `npm run lint` and `npm run build`; confirm the production build passes and record the code-block-related bundle size (Vue/CodeMirror chunk) — trim `basicSetup` only if the weight is egregious

  Outcome: lint clean; `tsc -b && vite build` passes (PWA generateSW, 130 precache entries). The language catalog is lazy as designed: ~30 grammar chunks (~24–104 kB each) are fetched only when that language is first used. The main `index` chunk is 1,160.63 kB min / 370.43 kB gzip; its added weight is the accepted Vue + CodeMirror core + `@milkdown/components`. Per design Decision 2 and ADR-0014 this cost is accepted deliberately — no `basicSetup` trim.