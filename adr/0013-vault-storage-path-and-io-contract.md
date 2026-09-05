# ADR-0013: VaultStorage path and I/O contract

- Status: Accepted
- Date: 2026-09-05

## Context

ADR-0003 established that filesystem access goes through a narrow `VaultStorage` abstraction, but left its shape sketchy: `list(path): Promise<Entry[]>` refers to an `Entry` type that is never defined, and nothing states what paths look like. PLAN task 3 makes the interface concrete before the File System Access implementation (task 4) and the scan + index (task 6) build on it. Two things make the contract load-bearing rather than cosmetic:

- ADR-0004 keys the in-memory index by `path: string`. Two implementations emitting different path shapes would produce inconsistent index keys.
- Page titles become filenames via wikilinks (ADR-0012). A `..` segment slipping into a path would let a reference walk outside the vault root.

## Decision

The interface is text-only with the following contract:

```ts
interface VaultStorage {
  read(path: string): Promise<string>;
  write(path: string, content: string): Promise<void>;
  delete(path: string): Promise<void>;
  list(path: string): Promise<string[]>;   // flat, recursive, files only
}
```

- `list` returns every file under the given path, at any depth, as vault-root-relative paths; directories never appear. This replaces the undefined `Entry[]`: no consumer in the plan needs a shallow look or directory entries, and the recursion lives in the implementation once instead of in each consumer.
- Paths are vault-root-relative, `/`-separated, with no leading `/`, no `.` or `..` segments, and no absolute paths. The empty string denotes the vault root. Invalid paths are rejected, not sanitized.
- `write` creates missing parent directories implied by the path.
- `read` and `delete` reject when the file is missing — never resolve with a sentinel. Errors propagate as the underlying error (e.g. FSA's `NotFoundError`); there is no normalized error type.
- The interface is text-only. Binary read/write (assets, PLAN task 8) extends it additively (`readBuffer`/`writeBuffer`) — the File System Access API serves both from the same handle, so no rework.

## Consequences

- Index keys (ADR-0004) are implementation-stable by construction.
- `..` is a trust boundary: rejecting it at the interface defends the vault root regardless of how a path was derived.
- No error-type module exists yet; one is added only when a consumer actually branches on error kinds.
- The one place that must hold this contract is the File System Access implementation (PLAN task 4), whose acceptance gates are the spec scenarios in `openspec/specs/vault-storage/spec.md`.