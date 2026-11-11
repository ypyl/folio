# Design

## Context

See `proposal.md` — Why. What shapes the approach:

- `src/vault/logseqImport.ts` is the whole transform: pure name/content rules
  plus `runLogseqImport(source, dest, { sourceName, onProgress })`, which reads
  through the `VaultStorage` interface and writes Markdown, assets, and the
  `.folio/imports.md` ledger. Its tests cover the rules with strings.
- The app's wiring is `handleImport` in `App`, the `LogseqImportPanel` and its
  button, `pickSourceFolder`, `addFolderFromHandle`, and the brand screen's
  `brandAction`.
- The app has no Node-side storage adapter; `VaultStorage` is implemented only
  by `FileSystemVaultStorage` (browser) and the demo's in-memory vault.
- The repo runs TypeScript through Vite and `tsc -b`; there is no TS runner for
  a script.

## Goals / Non-Goals

**Goals**

- One import implementation: the transform and its ledger behavior do not change.
- The app returns to a single filesystem picker and a brand screen with no import
  surface.
- A script a maintainer runs once per migration, with a readable report.

**Non-Goals**

- No app-side invocation, no CLI in the shipped bundle, no new import rules.
- No support for importing a Logseq graph without a local filesystem.
- No change to the demo, the vault, or the shell.

## Decisions

### D1: The script reuses the transform through a Node `VaultStorage`

`scripts/import-logseq.ts` defines `NodeVaultStorage`, a `VaultStorage` over
`node:fs/promises`:

- `read`, `write`, `readBinary`, `writeBinary`, `list`, `stat`, `remove` map to
  `readFile`, `writeFile`, `readFile` + `Blob`, `writeFile` + `arrayBuffer`,
  a recursive `readdir`, `stat`, and `rm`.
- Paths are vault-relative POSIX paths validated with the same `parsePath` the
  browser adapter uses, and resolved under a root; a resolved path outside the
  root is rejected.
- `write` creates parent directories; the destination root is created before the
  run; the source root must exist.
- `list` returns every file under the root with `/` separators, so the
  transform's `pages/`, `journals/`, and `assets/` filters see the same paths
  they see in the browser.

The script then calls `runLogseqImport` with the source's basename as
`sourceName` (the ledger key), prints the report, and exits non-zero on failure.
The transform is not copied, wrapped in a second implementation, or edited.

Alternative considered: rewrite the transform in the script. Rejected: two
implementations of the rules, and the app's tests would stop describing the
thing that runs.

### D2: `tsx` runs the TypeScript script

The script imports the app's TypeScript modules, so it needs a TS runner. `tsx`
is added as a dev dependency; the npm script is
`"import:logseq": "tsx scripts/import-logseq.ts"`, and the command is
`npm run import:logseq -- <logseq-folder> <folio-vault>`.

Alternatives considered:

- **A `.mjs` rewrite** needs the transform duplicated or bundled.
- **`node --experimental-strip-types`** cannot resolve the app's extensionless
  imports.
- **A tsc/esbuild build step** adds a generated file and a second command for one
  dev-only tool.
- **`ts-node`** is heavier than `tsx` for the same job.

`tsx` is a dev dependency and never reaches the app bundle.

### D3: The CLI contract is positional and strict

`import-logseq <source> <destination>`: both required; `--help` prints usage;
the source and destination must resolve to different directories; the source is
only read. On success it prints the counts the app's result pane showed (files
written, merged, assets copied and skipped, source files already imported, name
collisions) and exits 0; a failure prints the message and exits 1; a usage error
exits 2.

### D4: The app loses the import, not the capability's rules

Removed: `LogseqImport.tsx`, its CSS and tests, `handleImport`, `importView`,
`pickSourceFolder`, `addFolderFromHandle`, the import panel in the main pane, and
the brand screen's `brandAction` prop. Kept: `src/vault/logseqImport.ts` and its
tests, because the script uses them; `MIGRATION_LOGSEQ_FOLIO.md` remains the
rules' reference.

The brand screen's actions become the reconnect, the compact open-folder action,
and the demo. The workspace and navigation requirements that mention the import
are replaced (see the spec delta), and the `import` capability is retired.

### D5: The script's test drives the adapter, not the rules again

A Node-level test in the integration project builds a small Logseq graph and a
destination in `os.tmpdir()`, runs `importLogseq`, and asserts: the pages and
journal land in Folio form, the asset is copied, the ledger is written, a second
run reports the source as already imported and writes nothing new, and the
source is byte-for-byte unchanged. The transform's rule tests stay where they
are.

### D6: The screenshots and docs follow

The brand screen loses a button, so the phone manifest screenshots are
regenerated. `README.md` and `MIGRATION_LOGSEQ_FOLIO.md` replace the in-app steps
with the command; `NOTES.md` entries that describe the in-app import are updated.

## Risks / Trade-offs

- **A maintainer on Windows needs the right path quoting.** → The usage line
  shows positional paths; Node resolves them; no globbing is involved.
- **The script can write into a Logseq folder if pointed there.** → It refuses
  the same resolved source and destination; any other destination is the
  maintainer's choice, and the ledger makes a re-run safe.
- **`tsx` adds a dev dependency.** → It is dev-only, already backed by esbuild,
  and never bundled.
- **The app's tests lose the import flow.** → The script's integration test
  covers the adapter and the ledger; the transform tests cover the rules; the
  browser flow is gone by design.
- **The spec removal leaves an empty `import` spec.** → The archive step deletes
  the capability's spec file when its last requirement is removed.

## Migration Plan

No vault data changes. A user who wants to import runs the script once; the app
no longer offers it. The ledger remains compatible, so an in-app import done
before this change is not repeated by the script. Version takes a minor bump.
