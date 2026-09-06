# milkdown-editor

## Why

PLAN.md task 7: the open page still renders as a read-only preview (`MarkdownPreview`), and nothing in the app can write a file. This change puts Milkdown (ADR-0008) in the pane, makes pages editable in place, and adds the first write path: debounced auto-save with a dirty indicator, feeding the index through the upsert path ADR-0004 already anticipated.

## What Changes

- Open pages become **always-editable WYSIWYG** (Milkdown + commonmark preset). The read-only `MarkdownPreview` is deleted; its module CSS, tests, and the chip rendering go with it.
- **Reference chips are removed from the open-page surface**: `#word` and `#[[Page]]` render as plain editable text in the editor (what you type is what is saved; ADR-0012 keeps parsing the same text for the index). Plain `[[Page]]` stays literal text.
- **Write-through auto-save**: per-page drafts survive navigation (a page you edited and left keeps its text), saves are debounced (~1 s) and skipped when the draft equals the saved content, and only semantically different content is written.
- **Index upsert (B1)**: after a successful write, the vault graph is updated in memory — content and links re-parsed, `fold()` re-derived, mtime snapshot healed via `stat` so diff-rescan skips the file forever after. Never optimistic: a failed write leaves the graph consistent with disk.
- **Dirty indicator**: a fixed, muted text line on the pane — nothing when clean, "Unsaved changes", "Saving…", "Save failed". Failed saves stay dirty and re-arm on the next edit.
- **Editor seam (D1, ADR-0010)**: an `EditorAdapter` interface (`mount` / `setContent` / `getContent` / `onChange` / `destroy`) isolates ProseMirror behind the boundary; the draft/save/upsert logic is pure and tested against a fake editor, mirroring the `VaultStorage` / `fakeHandle` pattern.

## Capabilities

- **New Capabilities**: `page-editing` — the editor as the open-page surface, the auto-save lifecycle, and the dirty/error states.
- **Modified Capabilities**:
  - `static-navigation` — "Open page renders title and content" changes: rendered body + inert chips become an editable WYSIWYG body with references as plain text.
  - `vault-index` — new requirement: the index absorbs the app's own writes (upsert + snapshot heal).

## Impact

- **Dependencies**: `@milkdown/core`, `@milkdown/preset-commonmark`, `@milkdown/react`, `@milkdown/plugin-listener`, `@milkdown/plugin-history` (no `@milkdown/theme-*`; styling comes from Kami tokens, per DESIGN.md). Largest dependency set to date (~200–400 KB); no code-splitting case yet — the editor is the only view, and PWA precache (task 12) absorbs it.
- **Code**: new `src/editor/` (adapter + Milkdown implementation + draft/save hook); `EditorPane` rehosts the editor and the indicator; `App` gains the draft map and save orchestration; `vault/index.ts` gains the upsert; delete `MarkdownPreview.tsx` / `.module.css` / test; `parse.ts` `REF` regex keeps exactly one consumer (the index).
- **ADR**: ADR-0008 (Milkdown) and ADR-0010 (editor seam) already govern this. ADR-0004 records the write-through upsert (amend: upsert + snapshot heal on self-write).

## Non-goals

- **Page creation** ("New Page" button) — separate `page-creation` change, queued next (E2); `storage.write` already creates parents, so creation is a UI gap, not a seam gap.
- Clickable references / chips in content — deferred with the read mode; task 9's links pane is unaffected.
- Editing the page title — title is the filename stem (D1); rename is out of scope.
- Renaming, deleting, or moving pages.
- Multi-window live sync beyond the existing focus/visibility/interval refresh.
- Retry affordance for failed saves, offline save queue.
- Milkdown themes, custom editor nodes (a future reference node is possible per ADR-0008, YAGNI now).