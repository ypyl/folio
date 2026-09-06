# milkdown-editor — Tasks

## 1. Editor seam and dependencies

- [x] 1.1 Add Milkdown dependencies (`@milkdown/core`, `@milkdown/preset-commonmark`, `@milkdown/react`, `@milkdown/plugin-listener`, `@milkdown/plugin-history`) to package.json and verify `npm install` succeeds and `npm run build` still passes
- [x] 1.2 Define `EditorAdapter` (mount / setContent / getContent / onChange / destroy) in `src/editor/` and a `FakeEditor` test double implementing the same contract; verify it type-checks and the fake records content and change callbacks in its unit test
- [x] 1.3 Implement `MilkdownAdapter` (commonmark preset + listener + history, thin Kami-token theme, no `@milkdown/theme-*`) and verify a jsdom smoke test can mount it, round-trip `setContent` → `getContent`, and receive an `onChange` emission (trim the smoke test if jsdom cannot host ProseMirror, keeping the seam contract covered by the fake)

## 2. Save logic (pure, tested against fakes)

- [x] 2.1 Implement the per-page draft store (dirty/saving/failed/clean status per path, draft restored on reopen, isolated per page) and verify unit tests cover open, edit, leave, reopen, and status transitions
- [x] 2.2 Implement the debounced saver with compare-skip (write only when draft differs from saved content; re-arm on each edit) and verify unit tests cover the pause window, unchanged pages not being written, and a write that never runs when clean
- [x] 2.3 Implement the index upsert (`write` → `stat` → update page content + `parseLinks` + `fold()` + snapshot heal, non-optimistic — index changes only after the write resolves) and verify unit tests against the fake storage: saved edits visible immediately, backlink entries re-derive, the next diff-rescan skips the written file, and a failed write leaves the index unchanged

## 3. Editor pane and app wiring

- [x] 3.1 Rehost `EditorPane` on the adapter: static title heading + Milkdown surface, `setContent` on page switch, `destroy` on unmount; verify component tests render the title and editor and swap content when the page changes
- [x] 3.2 Add the save-state indicator (clean → nothing, "Unsaved changes", "Saving…", "Save failed", fixed while the pane scrolls) and verify component tests cover all four states
- [x] 3.3 Wire `App`: drafts map + debounced save + upsert against the active folder's storage, editor initialized from draft-or-index, failed saves keep dirty + show the error; verify App tests cover type → save → graph reflects content, leave-and-return restores the draft, and a failed save stays dirty and re-arms on the next edit

## 4. Cleanup and gates

- [x] 4.1 Delete `src/components/MarkdownPreview.tsx`, its CSS module, and its test; verify no remaining imports of MarkdownPreview and the `REF` regex is consumed only by `src/vault/parse.ts` consumers
- [x] 4.2 Run full gates and verify all pass: `npm test` (coverage ≥ 80% on statements/branches/functions/lines), `npm run lint`, `npm run build`, and `openspec validate --changes`