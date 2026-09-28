## Why

Folio's product is a folder of readable Markdown pages, and its decisions already reject the outliner/block model (ADR-0006, ADR-0009). List folding (ADR-0026) is the one affordance that rewards the opposite style — deep bullet nesting — and it leaves a permanent thin control lane along the editor's left margin to hold a chevron per nested item. That is real, standing complexity for a reading habit the app does not want to encourage: ~360 lines of editor and rail machinery, a resize observer, a layout-change channel across the editor seam, and a whole spec section. Removing it simplifies the main editing surface and keeps the app pointed at heading-structured documents.

## What Changes

- **BREAKING**: list-item folding is removed. Nested list content is always shown; there is no folded/expanded state and no fold control.
- The editor pane's **left rail is removed** along with it — the thin, full-height control lane in the document's left margin. Line numbers already left that lane when search marking landed, so folding was the only thing still in it.
- The editor seam drops the fold API: `FoldTarget`, `getFoldTargets()`, `toggleFold()`, and `onLayoutChange()`, together with their Milkdown and fake-editor implementations.
- Fold-only styling is deleted: the folded-item hiding rule and the rail/arrow rules. The document's asymmetric left gutter (sized for the rail) becomes a symmetric gutter.
- The `page-editing` spec loses its four folding requirements, and two unrelated requirements that assert the rail's placement are reworded so they no longer name a control lane that does not exist.
- A new ADR supersedes ADR-0026, recording the positive decision behind the removal: **Folio pages are heading-structured documents, not outliners.** ADR-0026's status becomes Superseded. DESIGN.md's Lists disclosure paragraph and its Left rail section are removed.

## Capabilities

### New Capabilities

None. This change removes behavior; it introduces no capability.

### Modified Capabilities

- `page-editing`: the four folding requirements ("A list item with children can be folded", "A folded item's hidden content cannot be edited", "Folding work stays bounded by the edited list", "Folding re-glues the rail") are removed. The "A table that begins a page keeps room for its controls" and click-below-to-continue requirements are reworded to drop their references to the left rail.

## Non-goals

- No table of contents, page outline, or any new panel section. A Contents panel is a separate change.
- No change to the meta panel's section order or to which sections open by default (Forwardlinks stays open for now).
- No change to lists themselves: native markers (ADR-0020), indentation, list creation and continuation, and the existing list-editing behavior all stay as they are.
- No change to the Logseq importer, journals, references, backlinks, or search marking.
- No migration or compatibility path: no fold state was ever persisted, so nothing needs converting.

## Impact

- **Code**: delete `src/editor/foldLists.ts`, `src/editor/rail.ts` and their tests; edit `src/editor/editor.ts` (seam), `src/editor/milkdown.ts` (adapter), `src/editor/fakeEditor.ts`, `src/components/EditorPane.tsx` (rail element, handlers, layout subscription, resize observer, `updateRail` calls) and `src/components/EditorPane.module.css` (padding and fold/rail rules).
- **Specs**: `openspec/specs/page-editing/spec.md` via the change's delta.
- **Docs**: a new ADR superseding ADR-0026; `adr/0026-...md` status change; DESIGN.md Lists and Left rail.
- **Tests**: fold and rail unit tests removed; `EditorPane`/`App` tests that assert fold controls or the rail updated.
- **No** filesystem, storage, or Markdown-format impact: folding never touched the vault, so files and reference syntax are unchanged.
