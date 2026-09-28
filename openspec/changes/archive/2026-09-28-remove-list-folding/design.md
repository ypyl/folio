## Context

List folding is view-only (ADR-0026): a ProseMirror plugin (`src/editor/foldLists.ts`) marks foldable items and carries a session-scoped folded set in the document's decorations, and a separate rail (`src/editor/rail.ts`) measures each marked item and writes a chevron button into the editor pane's left margin. Three seam methods carry it across the editor boundary (ADR-0010): `getFoldTargets()`, `toggleFold()`, and `onLayoutChange()`. The pane (`EditorPane.tsx`) owns the rail element, delegates its clicks, re-measures on the markdown stream and on a resize observer, and holds fold targets in a ref.

Line numbers already left that rail; folding is the only thing in it. Removing folding therefore removes the rail, and the document's left padding — sized to the rail's lane — is all that remains of it in layout. The proposal covers why. Constraints that shape the removal: the editor/KM seam must stay clean (ADR-0010), the native list marker must keep being drawn (ADR-0020), and no work may move onto the typing path (AGENTS.md).

## Goals / Non-Goals

**Goals:**

- Remove folding and the rail with **no residue**: no dead seam methods, no unused exports, no orphan CSS classes, no fake-editor fields.
- Leave the editor seam smaller, not merely different (ADR-0010).
- Keep everything folding touched only indirectly intact: native list markers, list creation/continuation, indentation, selection behavior, and the search-marking view operation (`highlightBlock`).
- Give the prose column a deliberate, symmetric gutter once the rail's lane is gone.

**Non-Goals:**

- No Contents/TOC panel (separate change), no meta-panel default changes.
- No change to lists, Markdown serialization, or reference syntax.
- No plain-text or vault migration: nothing was ever persisted.
- No change to search marking, `highlightBlock`, or the "space below the last block" behavior.

## Decisions

**1. Delete `foldLists.ts` and `rail.ts` outright, not gut them.** Folding is self-contained: only `milkdown.ts` (adapter), `fakeEditor.ts`, and `EditorPane.tsx` import their exports. Leaving the plugin in place with the controls removed would be dead code. Alternative considered: keep a minimal fold engine for a future panel — rejected as speculative (YAGNI); a future Contents panel should be designed on its own terms.

**2. Remove the three seam methods and `FoldTarget`, rather than keeping a generic layout channel.** `onLayoutChange`'s sole subscriber was the rail; `getFoldTargets`/`toggleFold` existed only for the chevrons. Keeping `onLayoutChange` "for later" adds a hook with no caller. `highlightBlock` remains the seam's one view operation. Alternative: generalize it — rejected; speculative.

**3. Delete the pane's `ResizeObserver`.** It observes the editor element only to call `updateRail()` on reflow; it has no other subscriber. Vault images sync on the markdown stream and on the seed mount, not on reflow, so image behavior is unchanged by its removal. This must be verified, not assumed (see Risks).

**4. Symmetric gutter.** `.document` padding goes from `4px 32px 4px 28px` (left sized to the rail) to `4px 32px`: the prose column keeps the established 32px reading gutter on both sides and the first block's start line is unchanged. Alternative: drop the left padding entirely (text to the pane edge) — rejected; a long line against a hard edge reads worse than a symmetric gutter, and it diverges from the right side. This is a visual detail, not spec-level; DESIGN.md records it.

**5. A new ADR supersedes ADR-0026.** The removal's real content is a positive product decision — *Folio pages are heading-structured documents, not outliners* — which is broader than "folding is view-only." Per `adr/README.md`, write the new ADR, have it reference ADR-0026, and change ADR-0026's status to Superseded. Alternative: edit ADR-0026 in place — rejected; it would erase the record of a decision that was deliberately made, and the repo convention is a superseding record.

**6. Order the removal so the build stays green.** Update call sites first (`EditorPane.tsx`, `milkdown.ts`, `fakeEditor.ts`), then delete `foldLists.ts`/`rail.ts` and their tests, then the CSS and docs. Removing modules before their callers would leave a broken intermediate state.

## Risks / Trade-offs

- [The fold plugin's `appendTransaction` repaired selections that landed in hidden content] → that repair existed only because content could be hidden; with no folds there is no hidden region. Verify with the page-editing list scenarios (Backspace, indent/outdent, Enter) after removal; no other plugin needs the repair.
- [A test that asserts a fold control or the rail silently passes once the selector no longer matches] → update or delete those assertions rather than leaving them vacuously green; fold/rail unit tests are deleted with their modules.
- [Orphaned global classes `folio-fold-item`/`folio-folded`/`folio-fold-head`/`folio-fold-arrow` remain in CSS] → grep for `folio-fold` after editing; delete every hit. The `li.folio-folded` hiding rule goes too.
- [The `ResizeObserver` removal changes image or layout behavior] → confirm the image sync path (markdown change + mount seed) is untouched; the observer was rail-only. If anything else needed reflow handling, it would not have had it before either, since the observer existed only for the rail.
- [Removing `onLayoutChange` from the adapter leaves an unused `notifyLayoutChange`/`layoutListeners`] → delete both; they have no other caller.
- [Lost navigation aid on bullet-heavy pages] → accepted by the proposal; the Contents panel is the intended replacement, delivered as its own change.

## Migration Plan

No data migration: fold state was session-only and never written to the vault or any storage, so there is nothing to convert and no file changes. Deployment is a normal commit; rollback is reverting it.
