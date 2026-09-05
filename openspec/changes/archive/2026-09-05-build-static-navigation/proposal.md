## Why

The shell (build-ui-shell) is static: the sidebar shows placeholder copy and the editor pane always shows the empty state. Before any real storage or indexing exists, Folio needs a navigable demo so the interaction model — pick a note, see it — can be felt and validated. This step proves the navigation shape with hand-authored data, on the same screens the real vault will later occupy.

## What Changes

- Introduce a **mock vault**: a small set of hand-authored sample pages and journal entries, living in one disposable data module, authored as portable Markdown.
- The **sidebar** lists the mock pages (Pages section) and journal entries (Journal section) as clickable rows, replacing the current placeholder copy in both sections.
- Clicking a row **swaps the editor pane** to show that page: an in-pane title heading plus a lightweight Markdown render (headings, paragraphs; `[[Page]]` and `#tag` as inert tag chips).
- The **empty state** remains the starting screen: on load no page is open and the brand empty state shows; clicking a sidebar row opens a page.
- `App` owns a single selection state (`active: MockPage | null`) passed down as props. Sidebar, editor, and future navigation callers route through it.

No filesystem, no persistence, no storage abstraction — all of that arrives in later steps (tasks 3-6). The mock is disposable scaffolding that the real index replaces.

## Capabilities

### New Capabilities
- `static-navigation`: selecting a mock page or journal entry from the sidebar and rendering it in the editor pane, with a persistent empty state when nothing is open.

### Modified Capabilities
- None. The `ui-shell` spec is unchanged; navigation is a new capability on top of it.

## Non-goals

- No clickable `[[Page]]`/`#tag` inside note content — chips are inert tag styling, not links. In-content link navigation arrives with the editor (Milkdown, task 7).
- No real backlinks/forwardlinks in the meta panel — it stays placeholder until the links pane (task 9), even though the mock data "knows" the links.
- No page creation — the `New Page` button stays inert (a plan gap: no task wires it yet; recorded during exploration).
- No calendar in the Journal section (task 10).
- No URL routing, no selection persistence, no search behavior, no keyboard arrow-list navigation.
- No `VaultStorage` interface, no File System Access implementation, no scanning or indexing (tasks 3-6).

## Impact

- `src/App.tsx`: add selection state and thread props to Sidebar and EditorPane.
- `src/components/Sidebar.tsx`: render page/journal rows inside the existing accordions; active-row styling.
- `src/components/EditorPane.tsx`: render the selected page (title + micro-render) or the existing empty state.
- `src/components/MetaPanel.tsx`: unchanged.
- New disposable mock module (e.g. `src/mockVault.ts`) with the `MockPage` type + data.
- `src/index.css`: shared list-row and tag-chip styles; EditorPane content styles.
- `src/App.test.tsx`: updated for the new sidebar/editor behavior; new coverage for the micro-render and selection logic (80% thresholds stay green).
- No new dependencies; no ADR changes (all decisions fit existing ADRs 0001, 0003, 0010, 0012).

## Related ADRs

- ADR-0003 (VaultStorage abstraction) — the mock is data at the app seam, not a storage impl, so it can be deleted when the real index lands.
- ADR-0010 (editor/vault separation) — the micro-render is throwaway presentational code in the editor layer.
- ADR-0012 (unified page references) — content chips are inert; navigation stays in the sidebar for this step.
