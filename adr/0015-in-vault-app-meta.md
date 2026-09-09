# ADR-0015: The `.folio/` directory is app-owned state inside the vault

- Status: Accepted
- Date: 2026-09-09

## Context

ADR-0001 says the Markdown folder is the database: every file in the vault belongs to the user, and all state must be rebuildable by scanning the folder. Pinned pages (add-pinned-pages) are per-vault state with no natural Markdown home: pinning must survive reopening, must ride with the folder, and must be editable by any tool. Storing pins in the app (IndexedDB) would make them app-only state — the exact thing ADR-0001 forbids — and lose them outside Folio.

## Decision

**Folio may keep small, app-owned state files inside the vault under a single hidden `.folio/` directory**, governed by these rules:

- The directory is **dot-named**: `.folio/`. The page index and search already exclude any path with a hidden segment, so `.folio/` never appears as a page, a search hit, or a reference source.
- The directory holds **plain, open formats** — today a Markdown list (`.folio/pins.md`) whose line order is meaningful. Any editor can read and edit it.
- The state it holds **must be rebuildable by scanning the directory**: the app reads the files on every index build and refresh, never relying on a copy anywhere else.
- Every write goes through `VaultStorage` like page writes, so the existing path, I/O, and non-optimistic write discipline (ADR-0013) applies unchanged.

This is a narrow carve-out of ADR-0001's "every file belongs to the user" reading: the folder remains the database and remains portable, but a reserved dot-directory acknowledges that some state is the app's business, not the user's prose.

## Consequences

- Pins (and any future meta like first-run markers) travel with the folder, survive reopening, and are visible/editable in any tool.
- The `.folio/` name is a namespace agreement: tools that respect dot-directories will leave it alone; the app never indexes it.
- Users see a hidden directory appear in their vault. The dot-name and the rule that it never produces pages or search results keep that footprint small.
- Removing Folio leaves `.folio/` behind as inert, human-readable files — no export step needed, consistent with ADR-0009's portability promise.
- A later feature must not extend `.folio/` into app-only binary or proprietary formats without a new ADR.