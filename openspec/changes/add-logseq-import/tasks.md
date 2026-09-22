## 1. Pure import rules

- [x] 1.1 Add `src/vault/logseqImport.ts` with `normalizeLogseqName` (percent-decoding of the known escapes, `___`/illegal-char mapping, leading-dot and trailing-dot/space stripping) and verify unit tests cover `%3A`/`%22`/`%2A`/`%2E`, `___`, `[`/`]`, leading space, and Windows-illegal output (`npx vitest run src/vault/logseqImport.test.ts`)
- [x] 1.2 Add the content rewriter (plain `[[X]]` to `#[[X]]`, alias drop, human-date to journal day, `((uuid))` to owning page, bullet-start task keywords to `#KEY`, noise-property and drawer-wrapper removal with data-property retention, `../assets/` to `assets/`, tab-to-two-space indentation, fenced-code passthrough) and verify unit tests cover each rule and the code-fence/URL non-rewrite cases
- [x] 1.3 Add the planner that turns source file records into an output plan plus report (journal date renames, nested `pages/journals` folding, `draws`/`whiteboards` to `assets/`, `logseq`/`.folio`/`custom.css` exclusion, name-collision ordering, dangling-reference list) and verify unit tests cover each inclusion/exclusion

## 2. Import orchestration

- [x] 2.1 Add `runLogseqImport(source, dest, { onProgress })` with a scanning phase then a writing phase, reporting `{ phase, done, total, item }`, and verify a fake-storage test observes progress advancing through both phases
- [x] 2.2 Implement the skip-existing merge (read the destination list once, never overwrite, never write `.folio/`) and verify a test that an existing destination file is untouched, `.folio/pins.md` is untouched, and a second run writes nothing
- [x] 2.3 Implement failure handling (stop on a read/write rejection, report the failing path, keep written files) and verify a test that a rejected write yields an error result and no success report

## 3. App seams

- [x] 3.1 Add a read-only source-folder picker to `src/vault/fs.ts` beside the existing read-write `pickVaultFolder`, and verify with a type check plus a unit test stubbing `showDirectoryPicker`
- [x] 3.2 Add `addFolderFromHandle(handle)` to `src/vault/useVault.ts` (one entry per folder via `isSameEntry`, persist, activate) and verify a unit test that importing into an already-listed folder adds no second entry and activates it

## 4. Brand-screen UI

- [x] 4.1 Add an optional brand-screen slot to `EditorPane` rendered under the tagline without changing its presentational role, and verify the component test renders the slot when provided and nothing when not
- [x] 4.2 Render the Import from Logseq action in `App` on the no-folder brand screen only where `canOpenFolders()` is true, and verify with an App test that the action appears with the picker and is absent without it
- [x] 4.3 Render the import progress (phase and done/total) and the result summary (written, skipped, copied) in the brand slot, and verify with a component test for each state
- [x] 4.4 Wire the `App` state machine — pick source, pick destination, run, show result, activate destination, reset on error or cancel — and verify with an App test using fake handles that the destination becomes active and its imported pages appear

## 5. Documentation

- [x] 5.1 Add `adr/0025-logseq-import-is-one-way-and-input-only.md` recording that the importer is a one-time input-only compatibility layer distinct from runtime parsing (ADR-0012), and add it to the ADR index/README
- [x] 5.2 Update `MIGRATION_LOGSEQ_FOLIO.md` and `adr/README.md` to note the in-app importer and that the CLI script and the app share these rules, and verify both read coherently

## 6. Verification

- [x] 6.1 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent` with no findings
- [x] 6.2 Run `npm run build` and `npm test` and confirm both pass
- [x] 6.3 Browser check with `npm run dev:test` in real Chromium: the brand screen renders the Import action and a cancelled picker returns to the brand screen with zero console errors. The full data path (write, result, activate) is covered by the App integration test over the real `FileSystemVaultStorage`, because the browser's native folder picker cannot be automated. Dev server swept with `npm run kill:dev`
- [ ] 6.4 Run `npx openspec validate add-logseq-import --strict` and resolve any findings
- [ ] 6.5 Bump the minor `version` in `package.json` and commit the change
