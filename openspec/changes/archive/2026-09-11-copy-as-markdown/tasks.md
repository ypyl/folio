## 1. Copy the selection as Markdown

- [x] 1.1 Add a `copyMarkdown` helper in `src/editor/milkdown.ts` that serializes a ProseMirror `Slice` with the existing `serializerCtx` (wrap `slice.content` in `schema.topNodeType.create(null, content)`) and verify it returns the canonical Markdown for a formatted fragment in a unit test
- [x] 1.2 Install a `copy` handler through `editorViewOptionsCtx`'s `handleDOMEvents` that writes `application/x-folio-markdown` for a non-empty selection and returns `false`; verify a test asserts the flavor equals the canonical serializer output and that an empty selection writes nothing

## 2. Prefer the flavor on paste

- [x] 2.1 In `handlePaste`, after the `.cm-editor` yield and the force-literal branch, read `application/x-folio-markdown` and, when non-empty, insert it via `insertParsedMarkdown` without consulting `looksLikeMarkdown`; verify a test pastes a flavor containing a lone `# Title` and an inline `**bold**` and asserts real heading and bold nodes
- [x] 2.2 Verify an ordinary paste with no flavor still routes through `looksLikeMarkdown` and that `Mod+Shift+V` still inserts `text/plain` verbatim with the flavor present (existing paste tests plus one new force-literal-with-flavor test)

## 3. Verify the workflow and the build

- [x] 3.1 Verify in the browser (playwright-cli, OPFS-backed vault) that selecting a formatted section, cutting it, opening a new page, and pasting yields the same structure, by comparing the saved `.md` to the source section
- [x] 3.2 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npm run build`, and `npx vitest run`, and verify all pass
