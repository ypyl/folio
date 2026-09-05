# build-vault-storage-interface

## Why

PLAN task 3 needs the `VaultStorage` seam from ADR-0003 as a concrete, implementable contract. The ADR sketches method signatures — including `list(path): Promise<Entry[]>` with an `Entry` type that is never defined — and task 4 (File System Access implementation), task 5 (open folder), and task 6 (scan + index) all build on this interface. Nailing the shape now means task 4 writes one implementation instead of inventing a contract, and task 6's index gets well-formed, host-independent path keys (ADR-0004).

## What Changes

- Add a types-only module `src/vault/storage.ts` exporting the `VaultStorage` interface with four methods: `read`, `write`, `delete`, `list` (all async, `path`-based).
- Settle the interface shape left open by ADR-0003:
  - `list` returns a flat, recursive `Promise<string[]>` of vault-root-relative file paths (all files, any depth; directories never appear). The undefined `Entry` type is dropped in favor of `string[]`.
  - Path contract: root-relative, `/`-separated, no leading `/`, no `..`, no absolute paths — invalid paths are rejected, not sanitized. `''` refers to the vault root.
  - `read`/`write`/`delete` on a missing file reject (never return `null`); errors propagate as the underlying error, no error-type module.
- Dereference PLAN's "in `src/vault/`" and the note in `mockVault.ts` that the mock is replaced when the real index lands: this change adds the seam; no consumer exists yet (component logic is untouched until tasks 5–6).
- Add ADR-0013 "VaultStorage path and I/O contract" recording the concrete contract (list shape, path rules, error stance) and its rationale; leave ADR-0003 intact except a one-line pointer to it, so the decision history records when the contract was settled.

## Capabilities

### New Capabilities

- `vault-storage`: The `VaultStorage` interface contract — `read` / `write` / `delete` / `list` semantics, the path contract, and error behavior.

### Modified Capabilities

- None.

## Non-goals

- No File System Access implementation (PLAN task 4).
- No wiring into the app; no component imports the vault (PLAN tasks 5–6).
- No in-memory/mock `VaultStorage` implementation — `mockVault.ts` stays as-is until task 6 (PLAN task 5 keeps the mock showing until a folder is chosen).
- No binary read/write support; asset handling (PLAN task 8) extends the interface additively later.
- No error-type normalization module; consumers do not branch on error kinds yet.
- No directory watching or external-change tracking (ADR-0004 notes this as a later concern).

## Impact

- **New file**: `src/vault/storage.ts` — types and interface only, no runtime statements.
- **New**: `adr/0013-vault-storage-path-and-io-contract.md` — the concrete contract and its rationale (ADR-0003 keeps its "there is a seam" role; one-line pointer added).
- **Modified**: `adr/0003-vault-storage-abstraction.md` — add a pointer to ADR-0013 / the vault-storage spec; sketch otherwise unchanged.
- **Possibly modified**: `vitest.config.ts` — if the always-on 80% istanbul coverage gate counts an untouched types-only file, a one-line `exclude` entry keeps thresholds honest (verification item, not a design decision).
- No component or dependency changes.