# Tasks

## 1. Derived data

- [x] 1.1 Add `collectCollapsibleBlocks(tree)` to `src/vault/contents.ts` (the
      `block` of every node with children, document order) and verify
      `src/vault/contents.test.ts` covers a nested tree, a flat tree, and an
      empty one.

## 2. Contents controls

- [x] 2.1 Render an Expand all and a Collapse all control at the top of the
      Contents list, only where rows render, wired to the existing collapse
      state; verify `src/components/MetaPanel.test.tsx` shows both controls
      collapsing every subtree and restoring every row, and that neither
      control appears for a page with no headings or while loading.
- [x] 2.2 Style the toolbar (quiet text buttons, sticky at the body's top,
      tokens from DESIGN.md) and verify with `npm run dev:test` that a long
      outline keeps the controls visible while the body scrolls.

## 3. Integration

- [x] 3.1 Verify locating a heading after Collapse all still works and nothing
      is written: run `npm run test`, `npx tsc -b`, `npx oxlint
      --deny-warnings --format=agent`, `npm run build`, `npm run test:e2e`.

## Workflow follow-up

- Sync the delta spec into `openspec/specs/contents/spec.md` and archive the
  change.
- Bump `package.json` (minor: new user-facing capability) in the feature commit
  and again in the archive commit, then push `master` to `origin` and `nas`.
