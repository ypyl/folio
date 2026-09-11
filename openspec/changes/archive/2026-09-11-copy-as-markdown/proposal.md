## Why

Copying or cutting text in the editor puts **plain text without Markdown syntax** on the clipboard: ProseMirror's default `clipboardTextSerializer` returns text nodes only (`textBetween(0, size, "\n\n")`), so a copied heading becomes `Budget`, bold becomes `20%`, a list becomes loose paragraphs, and a fence becomes bare code lines. The paste handler reads only `text/plain` and deliberately ignores `text/html`, and the markdown-likeness rule needs two or more block-level signals, so the app's own clipboard does not qualify. Measured on the running app: a section `## Budget / The plan grew **20%** this year. / - one / - two / ```js` copies as `Budget\n\nThe plan grew 20% this year.\n\none\n\ntwo\n\nconst x = 1`. The paste-as-markdown change made Markdown pasted **from other tools** become structure; it never made the app's own copy carry Markdown, so moving text between pages by cut and paste silently flattens it.

## What Changes

- Copy and cut in the editor additionally write the selection's **canonical Markdown** to a private clipboard flavor (`application/x-folio-markdown`). The existing `text/plain` and `text/html` flavors are unchanged, so copying into other applications behaves exactly as today.
- Paste checks for that private flavor first (after the existing code-block yield). When it is present, the text is parsed through the existing `parserCtx` path unconditionally, bypassing the markdown-likeness rule, so **any** selection round-trips: a single heading, an inline bold run, a list, a fence, or a multi-block section.
- Paste of external text (no private flavor) keeps the current markdown-likeness rule and the shift force-literal branch unchanged.
- This makes the manual "move to a new page" workflow — select, cut, write a reference, open the page, paste — faithful, so no move command is added.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-editing`: paste gains a priority path for the app's own clipboard content, and copy/cut gains a requirement to carry the selection as canonical Markdown.

## Impact

- `src/editor/milkdown.ts` — the adapter's copy handling writes the private flavor; `handlePaste` reads it before the sniff. `EditorAdapter` is unchanged (the copy and paste surfaces are already the adapter's).
- Tests: `src/editor/milkdown.test.ts` (copy flavor contents; paste of the flavor reconstructing structure; external text still sniffed).
- No new dependency; no storage or schema change. Markdown stays canonical (ADR-0001); the editor/vault seam is untouched (ADR-0010); no block model is introduced (ADR-0009). ADR-0008 holds; no ADR is needed.
- `openspec/specs/page-editing/spec.md` is amended by the delta spec.

## Non-goals

- No `move to a new page` command, prompt, or two-file write. The manual cut/copy-and-paste workflow is the feature once it is faithful.
- No change to `text/plain` or `text/html` on copy, so copying into external applications is byte-for-byte what it is today.
- No `text/html` paste path; rich web copies still paste as plain text.
- No cross-page undo, no clipboard history, and no custom flavor for other applications to consume.
- Code blocks keep their current behavior: a paste aimed inside a fenced block still yields to CodeMirror.
