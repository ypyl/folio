# Proposal

## Why

The CodeMirror 6 swap left reference completion broken. Typing `#re`, `#[[re`,
`#!re`, or `#![[re` produces no popup, so the user must remember and spell every
page or board name by hand. The `editing` spec already requires the popup
(`Typing a reference offers matching pages`), so the adapter drifted from
behavior the app is supposed to have, not the other way around.

Two defects in the adapter's completion source:

- CodeMirror's default completion filter re-filters the source's options against
  the raw replace range, which starts at the `#`. The fuzzy pattern `#re` never
  matches a label like `Reading`, so every row is dropped and CodeMirror builds
  no dialog at all. The app's own ranker (`suggestPages` / `suggestBoards` /
  `suggestFiles`) already filtered and ordered the rows, so this second pass is
  both wrong and lossy.
- The source never checks the syntax at the caret, so once the first defect is
  fixed a `#re` inside a fenced block or inline code would open the popup. The
  spec says the popup SHALL NOT appear inside code.

The regression slipped through because the swap deleted the 610-line
`referenceSuggest.test.ts` and replaced it with `completionSource` unit tests
that only assert `.apply` / `.from` / `.to`. Nothing mounts the adapter, types a
reference, and looks for a row, so no test could see an empty popup.

## What Changes

- Stop CodeMirror from re-filtering completion rows: every reference, board, and
  file `CompletionResult` sets `filter: false`, since the app's pools already
  rank and cap. The app's order (favorites first, then most recently modified)
  is preserved.
- Refuse to complete inside code: the source resolves the syntax node at the
  caret and returns null for `FencedCode` and `InlineCode`, matching the guard
  the removed ProseMirror plugin had.
- Add a real popup test that mounts `CodeMirrorAdapter`, types a reference
  through the view, and asserts the rows render, arrive in the app's order, and
  do not render inside code. Restore coverage the swap deleted.

Non-goals:

- No change to the triggers, the candidate pools, the ranking rules, or the
  canonical token forms (ADR-0012). `#word` and `#[[Page]]` stay the only
  reference forms.
- No change to the destination picker's behavior beyond the same one-line
  `filter: false`, which keeps its rows from being silently dropped or reordered.
- No popup restyling against `DESIGN.md` tokens; the CodeMirror default tooltip
  stays. A token pass is separate work if it is wanted.
- No new backend, database, or document model. Markdown stays canonical
  (ADR-0001, ADR-0009).

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None. `editing` already requires both the popup and the no-popup-inside-code
  rule, so this change restores the requirement instead of changing it. No spec
  delta is written; the change's `.openspec.yaml` sets `skip_specs: true`.

## Impact

- `src/editor/codemirror.ts`: `completionSource` gains `filter: false` on its
  three results and a caret-syntax guard.
- `src/editor/codemirror.integration.test.ts`: new popup coverage through a
  mounted adapter.
- Unchanged: `src/editor/editor.ts` (the seam, ADR-0010), `src/vault/parse.ts`
  and `src/vault/suggest.ts` (triggers, pools, ranking), `EditorPane.tsx`, and
  every app test that runs against `fakeEditor`.
- Related ADRs: ADR-0010 (completion lives in the editor layer, candidates come
  from the app through the seam) and ADR-0012 (the two reference forms). No new
  ADR is needed.
