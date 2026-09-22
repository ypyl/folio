## Why

Folio is a new app with no runtime migration compatibility (ADR-0012, AGENTS.md), so a
user who already keeps notes in Logseq has no way to bring them in. A one-time,
input-only importer turns an existing Logseq graph into a Folio vault without teaching
the app's parser, index, or editor to read Logseq's conventions. Without it the only
route is the throwaway CLI script in `scripts/migrate-logseq.mjs`.

## What Changes

- The brand (no-folder) screen gains an **Import from Logseq** action beside the
  open-a-folder invitation.
- Flow: pick the **Logseq source** folder (read-only) → pick the **destination** vault
  folder (read-write) → run the import → **show progress** → show a **result summary**
  and open the destination folder.
- The destination is merged **non-destructively**: any file that already exists there is
  skipped and reported, and `.folio/` (pins and other meta) is never written over. There
  is no overwrite and no delete.
- The import rules are exactly the validated set in `MIGRATION_LOGSEQ_FOLIO.md`: page
  and journal name normalization, reference rewriting, block refs flattened to the
  owning page, task markers as page references, property cleanup, asset path
  rewriting, nested `pages/journals` folding, and `draws/`/`whiteboards/` copied into
  `assets/`.
- The source folder is opened read-only and is never written.
- A new ADR records that the importer is a one-way, input-only compatibility layer,
  distinct from runtime parsing, so ADR-0012 is preserved rather than contradicted.

## Capabilities

### New Capabilities
- `logseq-import`: reading a Logseq graph, transforming it to a Folio vault, merging it
  into a destination without overwriting, reporting progress while it runs, and
  summarizing the result. Its browser entry point is the brand-screen action.

### Modified Capabilities
- `static-navigation`: the no-folder empty state additionally offers the import action
  alongside the open-a-folder invitation.
- `ui-shell`: the brand screen may render the import control and its progress and result
  states; the "no interactive control" rule is narrowed to controls for a vault the app
  cannot produce, and the folder rail accepts a folder added from an already-acquired
  handle (the picked destination) with the same one-entry-per-folder dedup.

## Non-goals

- No runtime Logseq compatibility: `[[Page]]`, `#a/b`, `((uuid))`, `collapsed::`,
  `{{query}}`, and Logseq task keywords stay inert outside the importer (ADR-0012
  stands).
- No export back to Logseq and no Logseq-to-Logseq round trip.
- No rendering of Excalidraw or whiteboard `.edn` files; they are copied as assets.
- No cancellation of a run in progress, and no resumable import.
- No import of `logseq/` config, `custom.css`, or `bak/` history.
- No preview/dry-run UI; safety comes from the skip-existing merge.
- No backend, database, or block model.

## Impact

- **New code**: `src/vault/logseqImport.ts` (pure rule transform plus an orchestration
  function that reads the source and writes the destination), a brand-screen import
  component and its styles, ADR-0025.
- **Modified code**: `src/App.tsx` and `src/components/EditorPane.tsx` (brand-screen
  action, progress, result), `src/vault/useVault.ts` (add/activate a folder from an
  already-picked handle), `src/vault/fs.ts` (read-only source picker).
- **Storage**: reuses the `VaultStorage` seam; only `readBinary`/`writeBinary` are used
  for assets. No new storage concept.
- **Docs**: `MIGRATION_LOGSEQ_FOLIO.md` remains the rule reference; the new ADR records
  the one-way import decision.
- **CLI**: `scripts/migrate-logseq.mjs` stays as the command-line equivalent; the app
  rules mirror it.
- **Cost**: the import runs once per invocation, off the keystroke path, with work
  proportional to the source graph. It adds nothing to typing.
