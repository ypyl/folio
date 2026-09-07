## Why

Search tells you *what* matched but not *where*. A hit in a long note opens the page and the match is somewhere below the fold — scrolling and scanning. Folio keeps Markdown canonical (ADR-0001), so a physical line in the file is a real, shareable address; giving the editor a quiet line-number gutter and teaching search to report the match's block-anchored line turns "there is a match" into "it's at line 42".

## What Changes

- The editor pane gains a **line-number gutter**: one small, dimmed number per top-level block, showing the block's start line in the document's canonical Markdown form (blank separator lines are counted but not shown, so numbers can read 1, 3, 5). Numbers are non-interactive, live-update as the document changes, and are aligned to each block's first line.
- **Lists get one number** at the list start (not per item); **code blocks keep** their existing CodeMirror local gutter and add the block's start number in the outer gutter.
- Search results — both the header dropdown and the full results view — show `· line N` next to the page title, where N is the block-anchored start line of the **first** text match. Title-only matches show no number.
- The numbering rule is a single shared, pure, fence-aware function (`a line starts a block iff it is the first line or follows a blank line`), used identically by the editor gutter and by search, so both sides agree by construction.
- Addresses follow the canonical form: any page saved by Folio lines up exactly with its file (and VS Code); a legacy wrapped import renumbers once saved. Documented caveat, not a bug.

No **BREAKING** changes: the Markdown on disk is untouched, the document model is untouched (ADR-0009), and no search or editor behavior is removed.

## Capabilities

### New Capabilities

(none — both halves extend existing capabilities)

### Modified Capabilities

- `page-editing`: the editor gains a new requirement — a quiet, non-interactive line-number gutter at block boundaries, computed from the canonical text, live on edits.
- `search`: search results gain a new requirement — rows report the first text match's block-anchored line (`· line N`), in the dropdown and the full results view.

## Non-goals

- **No scroll-to-match** on opening a page: the numbers are the address system; the user navigates to the line themselves. Auto-jump is a separate change.
- **No per-list-item numbering**: a list is one block and gets one number.
- **No seed-accurate file anchoring**: numbering follows the canonical form; a wrapped legacy page renumbers on its first save.
- **No CodeMirror gutter renumbering**: code blocks keep their local 1..N gutter.
- **No interactive numbers** (click/drag/select), no editor navigation commands (Cmd-G and friends), no line-number display in non-editor surfaces (search results view, meta panel).
- **No block-based document model** (ADR-0009): the gutter is presentation over existing blocks.

## Impact

- **New shared module** `src/lineAnchors.ts`: pure, fence-aware `blockStartLines(markdown) -> line[]` — the single consistency contract between editor and search (unit-tested against both canonical text and wrapped source text).
- **Editor layer** (`src/editor/milkdown.ts`): expose each top-level block's canonical start line; the canonical text is already produced per change, so this is line-math over existing data (ADR-0010 editor boundary respected).
- **Pane** (`src/components/EditorPane.tsx` + `EditorPane.module.css`): render the gutter inside the existing 48px left margin — absolutely positioned, `pointer-events: none`, `aria-hidden`, baseline-aligned to each block's first line, repositioned on document change and resize (ResizeObserver). Token treatment: 12px, `--stone`, right-aligned, no border (DESIGN.md).
- **Search UI** (`SearchBox.tsx`, `SearchResultsView.tsx`): `· line N` from the shared function; pure-testable.
- **Docs**: DESIGN.md gains a short gutter paragraph; no ADR (no architectural change).
- **Specs**: delta requirements added to `page-editing` and `search`.