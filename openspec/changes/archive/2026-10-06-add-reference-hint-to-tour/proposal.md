# Proposal

## Why

The app tour's editor step explains the pane — plain Markdown, saved as you type
— but not the gesture the whole app is built around: typing a reference to make
one. A new user finishes the tour knowing what the editor is and still not
knowing that `#word` creates a page or `#!word` creates a board. The one place
already pointing at each pane should teach linking while it has the attention.

## What Changes

- The tour's editor step names the reference forms the page surface accepts:
  `#word` and `#[[Page]]` for a page, and `#!word` for a board, with the note
  that referencing something new creates it on first save.
- The `workspace` tour requirement gains one clause: the step naming the editor
  area also names the forms that reference a page and a board.
- Nothing else changes: the other four steps, the overlay, the placement, the
  focus contract, the rail control, and the wide-only scope are untouched.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace`: the app-tour requirement gains a clause that the editor step names
  the page and board reference forms, so the tour teaches linking as well as the
  pane.

## Impact

- `src/tour/steps.ts`: the editor step's `body` string.
- `src/components/Tour.test.tsx`: one assertion that the editor step names the
  reference forms (the existing assertions cover the step order and the titles).
- `openspec/specs/workspace/spec.md`: the tour requirement, via the change's
  delta.
- Related ADRs: ADR-0012 (unified page references: `#word`, `#[[Page]]`) and
  ADR-0024 (a board is referenced by a `#!` token) supply the grammar this copy
  states. No new ADR: the change restates an existing grammar in existing chrome.
- Version: a patch bump (copy only).
- Not affected: no vault, index, parser, storage, or editor change; the tour
  still writes nothing and adds nothing to the typing path.

## Non-goals

- Not adding a reference hint to any other surface (the empty-state hint, the
  placeholder, the meta panel, or the shortcuts reference).
- Not changing the editor's behavior or the reference grammar; the copy states
  what already exists.
- Not changing the other four tour steps or the tour's layout, focus, or scope.
- No new dependency and no new ADR.
- No backend, no database, no block-based document model.
