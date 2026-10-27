# Proposal

## Why

The Contents tree can be collapsed one subtree at a time, which is the right
grain for reading but the wrong grain for the two jobs a reader actually has:
"show me the shape of this page" and "hide everything but the top sections".
On a page with a deep outline, collapsing it today means clicking every
disclosure control in turn, and there is no way back except the same clicks.

## What Changes

- The Contents section gains two controls, **Expand all** and **Collapse all**,
  that expand every subtree or collapse every heading that has one.
- Both are view operations, on the same terms as a single subtree toggle: they
  change what is shown, never the page's text, file, caret, history trail, or
  the vault. Collapse state stays per open page and session-scoped.
- Neither control locates a heading or moves the scroll position of the editor.
- The controls render with the rows they act on: a page with headings shows
  them, an empty or placeholder Contents shows none.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `contents`: the Contents section gains expand-all and collapse-all controls
  that set every subtree's state at once.

## Impact

- `src/components/MetaPanel.tsx` and `src/components/MetaPanel.module.css`: the
  Contents toolbar and the two handlers over the existing collapse state.
- `src/vault/contents.ts`: one pure helper that names the headings which have a
  subtree to collapse (derived from the built tree, no new parsing).
- Tests: `src/vault/contents.test.ts` for the helper,
  `src/components/MetaPanel.test.tsx` for the controls.
- No dependency, no storage, no vault, no editor-layer change. Markdown stays
  canonical and nothing is written (ADR-0001, ADR-0027). No new ADR: this is
  another read-only affordance on the heading surface ADR-0027 established.

## Non-goals

- No keyboard shortcut or command for expand-all/collapse-all.
- No persistence of collapse state: it stays session-scoped and per page, as it
  is today.
- No collapse level, "collapse to level 2", or outline mode; the tree still
  shows every heading when expanded.
- No change to how the tree is built, how a heading is located, or how a
  disclosure control behaves.
