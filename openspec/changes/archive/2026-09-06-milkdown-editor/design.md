# milkdown-editor — Design

## Context

Task 7 (PLAN.md) delivers the first write path. The open page is still a read-only preview (`MarkdownPreview`). ADR-0008 already chose Milkdown; ADR-0010 already drew the editor seam (boundary = Markdown serialization); ADR-0004 already promised "write-through (task 7) updates one object". This change implements those decisions through four forks settled in exploration: A1 always-edit, B1 upsert-after-write, C1 per-page drafts, D1 editor adapter.

## Goals / Non-Goals

**Goals:**
- Milkdown is the sole surface for open pages; preview and chips are deleted
- Debounced per-page auto-save through `VaultStorage`; dirty/saving/failed states
- The graph absorbs self-written pages in memory (no wait for refresh)
- Editor logic testable without a browser (adapter seam + fake)

**Non-Goals:** page creation (separate change), title editing/renaming, clickable references, retry buttons, offline queue, themes/assets (tasks 8+).

## Decisions

### D1 — Editor adapter seam (ADR-0010, concrete)
```
EditorPane -> EditorAdapter { mount(el), setContent(md), getContent(), onChange(cb), destroy() }
              MilkdownAdapter            FakeEditor (tests)
```
The pane and the draft/save logic depend on the interface; ProseMirror lives behind `MilkdownAdapter`. Same asymmetry as `VaultStorage`/`fakeHandle`: logic tested hard, transport smoke-tested. Milkdown deps: `@milkdown/core`, `preset-commonmark`, `react`, `plugin-listener` (get markdown on change), `plugin-history` (undo/redo). No `@milkdown/theme-*`: styling is a thin token-keyed stylesheet (parchment surface, near-black text, stone placeholder, brand links; DESIGN.md).

### D2 — Always-edit surface (A1)
Open page = title heading (filename stem, static) + Milkdown body. `MarkdownPreview.tsx/.module.css` and its tests are deleted; the shared `REF` regex stays in `parse.ts` with `MarkdownPreview` gone — the index is its sole consumer. References are plain text in the editor; chips are gone (static-navigation delta, page-editing spec).

### D3 — Save machine: per-page drafts, non-optimistic upsert (C1 + B1)
App owns `drafts: Map<path, { content, status }>`; the editor initializes from `drafts.get(path)?.content ?? graph content`. `onChange(md)` updates the open page's draft, marks it dirty, re-arms a ~1 s debounce. On fire: skip if `draft === saved`; else
```
write(path, content)  --VaultStorage-->  stat(path)  ->  pages.set + parseLinks + fold()
                                              -> update draft status: clean / saving / failed
```
Order matters: graph updates only **after** the write resolves (failed save keeps graph consistent with disk, page stays dirty, error shows, next edit re-arms). The post-write `stat` heals the mtime snapshot so diff-rescan skips the file forever. Navigation is a pointer move — no flush, no latency, switching back restores the draft (nothing in the debounce window is ever lost).

### D4 — Indicator
Pane-fixed muted text line, bottom-left, `--stone` on parchment, visible while scrolling: clean → nothing; dirty → "Unsaved changes"; in-flight → "Saving…"; failed → "Save failed" (persists until success). Text line only — no badge or status component (DESIGN.md has none; keep it calm).

## Risks / Mitigations

- **jsdom + ProseMirror fragility**: logic (drafts, debounce, save sequencing, upsert) is a pure hook/unit tested against `FakeEditor` + fake storage; the Milkdown component gets a thin smoke test (mount, setContent→getContent round-trip). Coverage target holds even if the smoke test is trimmed.
- **Bundle size (~200–400 KB new)**: one editor, one view — no code-splitting case; PWA precache (task 12) absorbs it. Revisit only if a second surface appears.
- **Round-trip normalization**: Milkdown serialization may normalize line endings; compare-skip prevents rewriting untouched files. A CRLF file is written as LF on its first real edit — accepted (Folio writes LF).
- **Editor lifecycle**: remount per page switch; `destroy()` on unmount; a page set while a save is in flight is safe because saves are keyed by path and upsert only touches that path.

## Migration

- Delete `src/components/MarkdownPreview.tsx`, `.module.css`, and its test.
- `page-references` spec: unchanged — forms, namespace, and literal-text rules all survive; only the chip rendering (which lived in `static-navigation`) is removed.
- Update PLAN.md task 7 checkbox on archive (config guidance: numbered task → `[x]`).

## Open Questions

None — forks A1, B1, C1–C3, D1–D4 settled in exploration; page creation deferred to its own change (E2).