## 1. Shared reference tokenizer

- [x] 1.1 Export the canonical reference scan from `src/vault/parse.ts` (expose `REF`, or add `findReferenceRanges(text): { from, to }[]` built on it) without changing `parseLinks`; verify `npx vitest run src/vault/parse.test.ts` still passes
- [x] 1.2 Add a fixture test proving the exported ranges and `parseLinks` targets agree for both forms, the escaped `#\[[Page]]` save form, `[[Page]]`, `#tag/word`, and a URL fragment; verify the new test passes

## 2. Badge decorations in the editor

- [x] 2.1 Add `src/editor/referenceBadges.ts`: a `$prose` plugin holding a `DecorationSet` in state, rebuilt on `tr.docChanged` and mapped through `tr.mapping` otherwise, skipping `code`-marked text and `code_block` subtrees; register it in `MilkdownAdapter.mount`; verify a unit test over the pure scan function (both forms badged, inline and fenced code skipped) passes
- [x] 2.2 Add a test that a selection-only transaction returns the mapped set without rescanning the document (assert scan-call count or set identity); verify it passes
- [x] 2.3 Add the `--chip-bg` token to `src/index.css` and the `.ref` badge rules to `src/components/EditorPane.module.css` per `DESIGN.md` (fill plus brand text, small radius, safe padding, `cursor: pointer`, hover to `--brand-tint`, text still selectable); verify in `npm run dev` that both forms render as badges and their text stays selectable

## 3. Click and keyboard navigation

- [x] 3.1 Extend the plugin with `handleClick` (position inside a reference range reports the target) and a `Mod-Enter` keymap for the caret-inside-a-reference case; verify a plugin test reports the target inside a range, reports nothing outside one, and lets `Mod-Enter` fall through when the caret is not in a reference
- [x] 3.2 Add `onReferenceClick(listener)` to `EditorAdapter` and `MilkdownAdapter` and an `onOpenReference(target)` prop on `EditorPane`; verify `npm run build` typechecks and the editor-adapter test passes
- [x] 3.3 Wire `onOpenReference` in `App.tsx` to resolve the target (`graph.byName` ?? `` `${target}.md` ``, skipping the open page's own path) and call `handleSelect`; verify with an App test that an existing target opens, a missing target opens a blank page, and a self-reference does not navigate

## 4. Discoverability and copy

- [x] 4.1 Add the `Mod-Enter` "Open reference" row to `SHORTCUT_GROUPS` and extend the drift guard in `src/components/shortcuts.test.ts` to assert the reference keymap binds that chord; verify `npx vitest run src/components/shortcuts.test.ts` passes
- [x] 4.2 Rewrite the reference section of `sample/Welcome.md` to describe badges and click / `Mod+Enter` to open; verify the copy no longer calls references "plain editable text"

## 5. Verification

- [x] 5.1 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`; verify the last command is clean
- [x] 5.2 Run `npm test` and `npm run build`; verify both pass
- [x] 5.3 Manually check the running app: badges on `#word` and `#[[Page]]`, no badge inside inline or fenced code, a click opens both an existing page and a not-yet-created page, `Mod+Enter` with the caret inside a reference opens it, and arrowing or typing through a reference-heavy page shows no repaint or lag
