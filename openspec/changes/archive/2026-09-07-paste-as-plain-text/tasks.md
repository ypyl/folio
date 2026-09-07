# paste-as-plain-text — Tasks

## 1. Paste interception in the adapter

- [x] 1.1 In `MilkdownAdapter.mount()`'s `.config()`, extend `editorViewOptionsCtx` with a `handlePaste(view, event)` that reads `event.clipboardData?.getData('text/plain')`; when empty/absent it returns `false` (default path), otherwise it replaces the selection with the raw string via `view.state.tr` and returns `true`. Verify: `npm run lint` and `npm run build` pass.
- [x] 1.2 Confirm the no-text fall-through leaves today's behavior untouched (copied files, empty clipboards do nothing) by review — the handler only ever consumes text/plain — and by the existing smoke tests staying green.

## 2. Paste behavior tests (jsdom, real adapter)

- [x] 2.1 Add a paste test: mount the adapter, dispatch a paste event whose faked `clipboardData.getData('text/plain')` returns rich content copied as plain text (e.g. `wow` from `<b>wow</b>`), and assert the serialized content contains no formatting markers for that text (spec: "Pasting formatted web text stays plain").
- [x] 2.2 Add a multi-line paste test (text/plain containing `\n`) asserting the line breaks survive into the serialized Markdown (spec: "Multi-line paste keeps its line breaks").
- [x] 2.3 Add the literal round-trip test: paste `**wow**`, then assert the serialized output, when fed back through `setContent`, serializes to the same literal text (stable round trip — no bold mark appears anywhere) (spec: "Markdown-looking text stays literal"). Assert round-trip stability, not a specific escape form.
- [x] 2.4 Add a no-text paste test (empty `text/plain`) asserting the document is unchanged (spec: "A clipboard with no text changes nothing").
- [x] 2.5 Add a regression guard that typing is unaffected: the paste path never touches the parser or input rules, so typed `**wow**` still yields a bold mark. jsdom cannot drive keystrokes (no execCommand), so verify this by review of the handler (it bypasses `parserCtx` and input rules entirely) and note it in the test file.

## 3. Integration checks

- [x] 3.1 Run `npm test`, `npm run lint`, and `npm run build`; verify all paste tests pass and no existing suite regresses.