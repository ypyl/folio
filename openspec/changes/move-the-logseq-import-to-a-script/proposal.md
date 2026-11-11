# Proposal

## Why

The in-app Logseq import is a one-time migration: a second storage adapter, a
progress/result pane, its own state, and a set of app requirements exist only so
a user can copy a Logseq folder into a Folio vault once. It also drags the brand
screen into hosting an import flow and gives the app a second filesystem picker
for no ongoing benefit. A repository script does the same work once, with no app
surface, and keeps the proven transform.

The importer's transform is already pure and unit-tested; only its browser
wiring is app-specific. Moving the wiring to Node keeps one implementation.

## What Changes

- **The app no longer offers an import.** The brand screen's Import from Logseq
  action, its progress and result pane, the import state in `App`, the second
  folder picker (`pickSourceFolder`), and the `addFolderFromHandle` path it used
  are removed. The no-folder screen offers the folder action, the guided demo,
  the reconnect, the tour, and the repository line, and nothing else.
- **The import becomes `npm run import:logseq -- <logseq-folder> <folio-vault>`.**
  A Node script wraps the existing transform in a `VaultStorage` over
  `node:fs/promises`, prints the report (written, merged, assets copied and
  skipped, already imported, collisions), and exits non-zero on failure. It keeps
  the hidden `.folio/imports.md` ledger, so a re-run appends only fresh sources,
  and leaves the source untouched.
- **The transform stays.** `src/vault/logseqImport.ts` and its tests are
  unchanged; the app simply stops importing them.
- **The `import` capability is retired from the app's specs**; the script is
  documented in `README.md` and `MIGRATION_LOGSEQ_FOLIO.md` as repo tooling, not
  as app behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `import`: removed. Its requirements describe an in-app flow that no longer
  exists; the transform's rules remain in `MIGRATION_LOGSEQ_FOLIO.md` and the
  script.
- `workspace`: the brand screen no longer offers or hosts the import.
- `navigation`: the no-folder state offers the folder action and the demo, not
  the import.

## Non-goals

- **No change to the transform's rules.** The translation, merge, ledger,
  collision, and reporting behavior stay exactly as the tests hold them.
- **No new importer for another tool.** This moves the existing import; it does
  not add one.
- **No app-side "run the script" integration.** The script is a repo tool, not a
  UI.
- **No dependency on the script at runtime.** The app builds and runs without it.
- **No change to the wide or compact shell.**

## Impact

- **A new `scripts/import-logseq.ts`**, an `import:logseq` npm script, and a
  `tsx` dev dependency to run TypeScript directly.
- **`src/App.tsx`**, `src/components/EditorPane.tsx`, `src/vault/useVault.ts`,
  `src/vault/fs.ts` lose the import wiring; `LogseqImport.tsx`, its CSS, and its
  tests are deleted.
- **A script test** exercises the Node adapter and the ledger against a temp
  directory.
- **Specs, README, `MIGRATION_LOGSEQ_FOLIO.md`, `NOTES.md`, and the manifest's
  screenshots** (the brand screen changes, so the phone screenshot of it is
  stale) are updated. Version takes a minor bump.
