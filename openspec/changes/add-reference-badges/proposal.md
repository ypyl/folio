## Why

Page references (`#word`, `#[[Page]]`) are the app's link graph, but in the editor they render as plain black text indistinguishable from prose. A reader cannot see which words are links, cannot jump to a page from the body, and must cross-reference the Forwardlinks panel to discover what the page points at. The old read-only preview rendered reference chips; when Milkdown replaced it (milkdown-editor), the chips were deliberately dropped and the page-editing spec now forbids them. Bring the reference back as a visible, clickable badge in the editable surface.

## What Changes

- References in the open page render as **badges** (padded chip: `--chip-bg` fill, `--brand` text) instead of plain text. Both forms get the same treatment; plain `[[Page]]` stays literal text (ADR-0012, unchanged).
- A **plain click on a badge opens the referenced page** — an existing page, or a blank page that materializes on first save when the target does not exist yet (the same resolution the Forwardlinks panel uses).
- The badge is **presentational only**: it is a ProseMirror inline decoration over the literal text, not a node. The underlying Markdown is untouched; what you type is what is saved (ADR-0001, ADR-0009).
- Badge appearance **never depends on the caret or focus** (no reveal-on-edit). The decoration is recomputed only when the document changes, so caret moves and focus changes do no work and cause no repaint.
- **`Mod+Enter` with the caret inside a reference opens it** (keyboard path); the Keyboard shortcuts panel gains the entry.
- **BREAKING (internal):** the page-editing requirement "References are plain editable text" — which today forbids chips and forbids navigation — is replaced. The two forms stay editable text; they additionally render as clickable badges.
- No chip appears inside inline `` `code` `` or a fenced code block.

## Capabilities

### New Capabilities
<!-- None. The behavior belongs to the editor surface already owned by page-editing. -->

### Modified Capabilities
- `page-editing`: the "References are plain editable text" requirement is replaced by two requirements — references render as clickable badges, and a badge click/`Mod+Enter` opens the target page — and the existing prohibition on chips and on click navigation is removed for Folio's two supported reference forms (plain `[[Page]]` remains literal, non-badge text).

## Impact

- `src/editor/` — new reference-decoration plugin (scan the doc for the canonical `REF` token, emit `Decoration.inline`, skip `code` marks and `code_block` nodes; recompute on doc change only) and a small adapter addition so the editor reports "reference clicked at target X" across the seam (ADR-0010).
- `src/components/EditorPane.tsx` — pass an `onOpenReference(target)` prop through to the adapter.
- `src/App.tsx` — resolve `target` to a path (`graph.byName` ?? `` `${target}.md` ``, self-reference skipped) and route through the existing `handleSelect`, reusing the Forwardlinks resolution.
- `src/vault/parse.ts` — export the canonical `REF` regex (or a range helper) so the editor decorates exactly what the index counts (design D6); the index behavior is unchanged.
- `src/index.css` — add the `--chip-bg` token already specified in `DESIGN.md`.
- `src/components/shortcuts.ts` — add the `Mod-Enter` "Open reference" entry.
- `sample/Welcome.md` — its copy says references are "plain editable text"; update to describe badges and click-to-open.
- `openspec/specs/page-editing/spec.md` — the requirement delta.
- ADRs: governed by ADR-0012 (reference forms), ADR-0008 (extend Milkdown), ADR-0010 (editor/vault seam), ADR-0009 and ADR-0001 (Markdown canonical). **No new ADR is needed** — this is an editor-layer rendering change under existing decisions.

## Non-goals

- **No custom ProseMirror reference node.** The badge stays a decoration over editable text; there is no schema, serializer, or second parser for references (the index's `REF` regex remains the single tokenizer).
- **No reveal-on-edit / source-mode-on-focus.** Badges do not turn back into raw text when the caret enters the block; that behavior is rejected because it repaints on every caret move and makes an edit click navigate mid-paint.
- **No plain-click-to-edit-inside a reference.** A plain click opens the page; editing a reference is by keyboard or by clicking at the edge of the badge. A later change may add a modifier-to-edit gesture.
- **No accessibility role on the badge.** The Backlinks/Forwardlinks panel remains the focusable, keyboard-navigable link list; the badge is not given `role="link"` or a tab stop. `Mod+Enter` is the keyboard open.
- **No fix to the index counting references inside code spans/fences.** That over-count is pre-existing; this change only stops the *badge* from appearing in code, and notes the mismatch.
- **No new reference syntax, no tags, no backlinks/pane changes, no link previews or hover cards, no history/visited state.**
- **No code-block changes**; the CodeMirror surface is untouched.
