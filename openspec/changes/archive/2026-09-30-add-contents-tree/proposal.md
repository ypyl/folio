## Why

A page's headings are already listed in the meta panel's Contents section, but as a flat, indented list: a long page shows every section at once and gives no way to fold away detail that is not currently relevant. ADR-0027 names a table-of-contents surface over headings as the intended replacement for the removed list-item folding, so a reader who wants to see a page's shape and narrow it down has nowhere to do that.

## What Changes

- The Contents section renders the open page's headings as a **tree** instead of a flat list: a heading is nested under the nearest preceding heading with a lower level, and a heading with deeper headings after it owns that run as its subtree.
- A heading that has a subtree gets a **disclosure control**; activating it collapses or expands that heading's subtree. Activating a heading's own label still locates the heading, exactly as today.
- Collapsing hides the subtree's rows only. It is **view-only and session-scoped**: nothing is written to the vault, no Markdown changes, no `.folio/` entry, and opening another page (or reloading) shows every heading expanded. This follows the view-only scoping ADR-0026 set for the analogous list folding and keeps Markdown canonical (ADR-0001, ADR-0009).
- Indentation stays one step per heading level, so the tree keeps the existing level-based indent, and a heading with no subtree keeps its label aligned with its siblings.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-contents`: the Contents requirement changes from a flat indented list to a tree of headings, adds a disclosure control that collapses/expands a heading's subtree, and states that collapse is view-only and session-scoped.
- `ui-shell`: the meta-panel requirement's description of Contents rows ("indented by level") gains the tree and per-heading disclosure, and its scrolling behavior is unchanged.

## Non-goals

- No persistence of collapse state: no Markdown property, no `.folio/` entry, and no resumption after reload (ADR-0026's session scoping).
- No change to what counts as a heading, to the heading text reduction, or to the locate-on-activation behavior (ADR-0027).
- No folding of list items or any editor-surface control: folding stays removed (ADR-0027).
- No change to the Links section, the keyboard-shortcuts reference, search, the sidebar, or the editor.
- No new ADR: this fills in ADR-0027's named replacement surface and reuses ADR-0026's view-only scoping rather than changing a decision.

## Impact

- `src/vault/contents.ts`: a pure tree build over the existing `ContentEntry[]` (parent/child from heading levels), with tests.
- `src/components/MetaPanel.tsx` and `MetaPanel.module.css`: render the tree, the disclosure control, and session-scoped collapse state.
- Tests: `src/vault/contents.test.ts` and `src/components/MetaPanel.test.tsx`.
- Specs: `page-contents`, `ui-shell`.
