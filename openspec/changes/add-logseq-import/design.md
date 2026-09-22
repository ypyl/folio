## Context

The importer turns one Logseq folder into a Folio vault. It is the browser counterpart
of `scripts/migrate-logseq.mjs`, whose rules were validated end to end against the real
graph and are written down in `MIGRATION_LOGSEQ_FOLIO.md`. See `proposal.md` for why.
The app already has every seam it needs: `VaultStorage` with `readBinary`/`writeBinary`
(ADR-0013), the `FileSystemVaultStorage` transport, `useVault`'s folder registry, and the
brand screen inside `EditorPane`. Nothing about the index, editor, or parser changes.

## Goals / Non-Goals

**Goals**

- One pass that transforms a Logseq graph into Folio Markdown and merges it into a
  destination, with progress visible throughout.
- The rule set mirrors the validated CLI exactly, so the well-known edge cases (URL
  fragments, code fences, Windows-illegal names, aliased links, unbalanced fences) are
  handled the same way.
- All filesystem access through `VaultStorage`; the source is opened read-only.

**Non-Goals**

- Streaming import. Block-reference targets and name resolution need the whole source
  graph before any output is written.
- A dry-run preview UI or cancellation.
- Any runtime Logseq parsing outside this feature.

## Decisions

### D1. A pure rule module plus a thin IO orchestrator

`src/vault/logseqImport.ts` holds two layers:

- **Pure**: name normalization and content rewriting (the rules), plus a planner that
  turns source file records into output records (`{ path, text }` and assets to copy)
  and a report. Mirrors `scripts/migrate-logseq.mjs` one-for-one.
- **Orchestration**: `runLogseqImport(source, dest, { onProgress })` lists and reads the
  source, calls the pure planner, then writes the plan, reporting progress.

Alternatives: reusing the Node script (impossible in the browser); folding rules into the
index parser (rejected — ADR-0012 keeps runtime parsing Folio-only). The split keeps the
rules unit-testable with plain strings, exactly like `src/vault/parse.ts`.

### D2. Both folders through `VaultStorage`

The source and destination are read through the existing seam: `list('')`, `read`,
`readBinary` for the source; `list('')` for the destination's existing set, then `write`
and `writeBinary`. The source picker requests `mode: 'read'`; the destination uses the
existing read-write picker. No raw handle walking — that would duplicate the transport
and break ADR-0003.

### D3. Plan, then write, so progress has totals

The run has two phases: **scanning** (list + read every source Markdown file to build the
name map and block-reference map) and **writing** (write Markdown and copy assets). The
UI shows the phase and `done/total`, with `total` known at each phase's start. The scan
must finish first because a block reference can point at another file, and reference
targets must resolve against the full name map. Progress is a callback, not a return
value, so the UI can render mid-run; each IO step is awaited, so the main thread is never
blocked by a synchronous whole-graph pass.

### D4. Merge by skip, computed once

The destination's file list is read before writing; a planned output path already present
is skipped and counted, never opened for writing. `.folio/` paths are never in the plan
and are refused defensively; pins are untouched. This makes re-runs idempotent and lets a
failed run resume by simply running again.

### D5. The brand screen hosts the flow, `EditorPane` stays presentational

`EditorPane` already owns the brand screen. It gains one optional render slot shown under
the tagline; `App` owns the import state
(`idle → picking source → picking destination → importing → done | error`) and passes
either the Import button or the progress/result node. The pickers, the rule module, and
the destination activation stay in `App`/`vault`, not in the pane. Alternative: a
separate brand-screen component — rejected as a larger refactor for the same result.

### D6. A folder joined from an already-picked handle

The destination is already granted by the time the import runs, so `useVault` gains
`addFolderFromHandle(handle)`: dedup by `isSameEntry`, create storage, persist the handle,
activate. It reuses `openNewFolder`'s body minus the picker. Re-invoking the picker (the
current `addFolder`) would ask twice and is rejected.

### D7. Source name collisions do not abort the run

Two source files can normalize to one Folio name. The plan orders outputs by source path,
and the skip-existing write means the first wins and the later one is reported as
skipped. This differs from the CLI (which aborts) because in the app a hard abort would
block an otherwise usable import; the report keeps the collision visible.

### D8. A new ADR records the one-way import decision

ADR-0012 and AGENTS.md say other tools' conventions are not features. The importer reads
Logseq conventions once, at the user's request, and writes Folio forms; it never becomes
a runtime parser. ADR-0025 states this boundary so the feature does not read as a
reversal of ADR-0012.

## Risks / Trade-offs

- **[Whole-graph memory]** The scan holds every source Markdown file's text at once. For
  the target scale (~500 files) this is small; the alternative (two passes over disk)
  buys nothing and doubles IO. → Accept; note the figure if a much larger graph appears.
- **[Silent rule drift from the CLI]** The app rules and the script could diverge. →
  Rules are copied verbatim and unit-tested; `MIGRATION_LOGSEQ_FOLIO.md` stays the shared
  reference.
- **[Malformed source fences]** A source file with an unbalanced fence leaves a region as
  code, so a few `collapsed::`/`((uuid))` tokens survive. → Same behavior as the CLI;
  reported in the result, not hidden.
- **[Partial write on failure]** A mid-run failure leaves written files. → Files are
  never overwritten, so a re-run completes the job; the error names the failure.
- **[No undo]** Imported files are ordinary vault files with no provenance marker. →
  Accepted; the destination is user-chosen and merge never deletes.

## Migration Plan

Not applicable: a new, user-initiated feature over an existing seam. No stored data
format changes and no schema migration. Removing the feature would leave imported vaults
intact as ordinary Markdown.
