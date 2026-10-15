# TODO

Engineering findings from a full-repo audit. Not product ideas — those live in
`PLAN.md`. Each item names the file, the concrete problem, and the fix. Most are
small fixes done directly; any item that changes observable behavior goes
through OpenSpec first (`/opsx-propose`), per `AGENTS.md`.

Ordered most important first.

## Must fix

- [ ] **Pending edits are lost on folder switch and tab close** (`src/App.tsx:778-799`,
      `src/editor/saver.ts:32-36`). The 1s debounced writer drops its pending map
      without writing: the folder-change effect runs `drafts.clear()` then
      `dispose()`, and there is no `pagehide`/`beforeunload` flush. Type a
      sentence, switch folders within a second, and it never reaches disk.
      Fix: flush the old saver *before* `drafts.clear()`; make `dispose()` fire
      the pending writes instead of clearing them; add a best-effort flush on
      `pagehide`/`visibilitychange`-hidden. Add a test for the folder-switch case.

## Should fix

- [ ] **An external file delete can reject the whole refresh** (`src/vault/useIndex.ts:69-81`).
      The initial build has a `.catch`; `refresh` does not, so a file deleted
      between `list` and `stat` rejects the refresh and logs an unhandled
      rejection. Fix: one `.catch` after `buildIndex`, matching the initial build.
- [ ] **A doc comment sits above the wrong function** (`src/App.tsx:71-83`). The
      `pageReferenceRows` comment (lines 71-78) is stranded above
      `orderByLastEdited`. Fix: move it down to `pageReferenceRows` (line 91).
- [ ] **~230 lines of dead Milkdown/ProseMirror CSS** (`src/components/EditorPane.module.css`).
      Lines 241-296, 385-503, and 630-857 target classes that no longer exist
      (ADR-0029 replaced Milkdown with CodeMirror). `milkdown`/`ProseMirror`
      appear in no `.ts`/`.tsx`. Fix: delete those rule blocks; keep every
      `.cm-*` rule.
- [ ] **Trim the integration suite where e2e already covers it** (`src/App.integration.test.tsx`).
      486 integration tests (jsdom, whole `<App/>`) dominate the run; search,
      whiteboards, compact shell, tour, and history flows also have Playwright
      specs. Fix: drop the overlapping happy paths from `App.integration.test.tsx`
      (~40 shell-level tests); keep the pre-index states, failure branches, and
      "stays off the typing path" assertions. Leave the unit suite alone.
- [ ] **`App.tsx` is one 1187-line component** (`src/App.tsx:109-1296`, 54 hooks).
      Fix: move the pure row builders (`useMemo` block near 838-960 plus
      `orderByLastEdited`/`pageReferenceRows`) into a module taking
      `graph`/`page`/`pins`; keep state and effects in `App`. No behavior change.
- [ ] **Flaky tests** (`tests/e2e/editing.spec.ts:109`, `src/App.integration.test.tsx`).
      The image spec asserts every `<img src>` is a `blob:` after a scroll,
      racing the viewport pass; it fails under parallel load and passes alone.
      Fix: assert on the one image (`toHaveAttribute('src', /^blob:/)`) so
      Playwright waits, or run that spec serially.
- [ ] **A queued image path can be lost** (`src/editor/assetImages.ts:167-170`).
      `pump` shifts a path off the queue then returns if `cache.read` is null.
      Fix: peek (`cache.queue[0]`) and shift only once a read starts, or push the
      path back before returning.

## Nice to have

- [ ] **Redundant nested try/catch** (`src/vault/assetOpen.ts:130-140`). The outer
      `try`/`catch` in `vaultTarget` is unreachable. Fix: keep the inner one only.
- [ ] **Exports used only inside their own file** (`vault/index.ts`,
      `vault/assetOpen.ts`, `search/core.ts`, `editor/assetImages.ts`):
      `BOARDS_DIR`, `BOARD_EXT`, `domOpeners`, `Openers`, `AssetReader`,
      `SearchSection`, `SnippetWindow`, `Segment`, `VisibilityObserver`,
      `AssetImagesOptions`, and a few trigger/stat types. Fix: drop `export` where
      nothing else imports the name.
- [ ] **A test file names the wrong module** (`src/editor/codePanel.test.ts` tests
      `codePanelLines` from `./codemirror`). Fix: rename to
      `codemirror.codePanel.test.ts`, or fold its three cases into the existing
      `codemirror.*` tests.
- [ ] **Logseq import rewrites the whole ledger after every file**
      (`src/vault/logseqImport.ts:415`), O(n²) on a large graph. Only worth
      changing if an import feels slow: flush every N files and accept a crash
      window of N re-appends.
