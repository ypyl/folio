## Context

The `VaultStorage` interface and its contract are locked (ADR-0013, `openspec/specs/vault-storage/spec.md`). This change provides the first implementation, wrapping the File System Access API (ADR-0002). The browser API shapes everything: handles resolve one segment at a time (no nested paths), `values()` lists only direct children, and writes go through `createWritable()`. No consumers exist yet — this is transport code with no UI, so it ships with tests that exercise the spec scenarios directly.

## Goals / Non-Goals

**Goals**: A `FileSystemVaultStorage` implementing all four operations against FSA handles; a `pickVaultFolder()` factory; the 11 existing spec scenarios plus new scenarios covered by unit tests against an in-memory fake.

**Non-Goals**: Open-folder button wiring, IndexedDB persistence, reload permission negotiation (task 5); scan/parse/index (task 6); binary read/write (task 8).

## Decisions

**D1 — `delete(path)` removes directories recursively with `removeEntry(name, { recursive: true })`.**
One flag makes delete handle files and directories uniformly, with no type probe. The spec's "file removed" scenario still holds; the directory scenario is additive. Alternative considered: rejecting directory deletes explicitly (a probe on every delete — extra code for behavior no consumer needs yet). Accepting the small spec extension over the dead code.

**D2 — The class assumes a granted handle; permission negotiation is the caller's job.**
`pickVaultFolder()` calls `showDirectoryPicker({ mode: 'readwrite' })`, which grants readwrite for the session — so everything the class does just works. After reload, an IndexedDB-restored handle (task 5) resets to `'prompt'` and needs `requestPermission()` from a user gesture; the class performs no permission calls at all. If the browser throws (e.g. `NotAllowedError`), it propagates per "errors propagate" (ADR-0013). Alternative considered: per-op permission guards or a constructor-time check — either is dead code at construction (the picker already granted) and couples transport to a UI flow. Risk if violated: ops fail at runtime in a restored session — task 5's responsibility, made explicit in its eventual design.

**D3 — FSA resolves paths one segment at a time; every operation walks the path first.**
`getFileHandle('journals/x.md')` throws — Chromium resolves single names only. A shared path parser splits on `/` and rejects any empty segment (`a//b`, trailing `/`), `.` or `..` segment, leading `/`, or absolute form (ADR-0013: reject, never sanitize). Operations then walk the segments with `getDirectoryHandle(seg, { create })`, creating intermediate dirs only for `write`, and resolve the leaf with `getFileHandle`/`removeEntry` on the parent. A `list(path)` whose path is a file throws `TypeMismatchError` — it propagates. Filenames like `a.b.md` are valid; only exact `.`/`..` *segments* reject.

**D4 — `list()` recurses manually and returns a sorted flat array.**
`values()` yields direct children only; recursion is ours. Each file handle contributes `prefix + name` (root-relative, `/`-joined); directories recurse; directories never appear in the result. The result is sorted lexicographically — FSA child order is not a stable contract, and sorting makes scan/index and tests deterministic. `list()` returns *everything* (hidden files, `node_modules`); filtering to `.md` is the consumer's job (task 6).

**D5 — Tests use an in-memory fake keyed to the FSA handle subset, cast to the DOM type.**
jsdom/node have no FSA implementation. `fs.test.ts` builds a tiny fake `FileSystemDirectoryHandle` (a `Map`-backed tree implementing `getFileHandle`, `getDirectoryHandle`, `values`, `removeEntry`, `createWritable`) with the same failure modes the impl depends on (`NotFoundError` on missing, `TypeMismatchError` on wrong kind). The impl types against the real `lib.dom` type; the fake casts via `as unknown as FileSystemDirectoryHandle` — no invented internal interface (the fake is the only second implementation, so the cast is cheaper than a seam). 11+ scenarios run as unit tests at vitest speed. Real-API cross-validation arrives with task 6's end-to-end pass. Risk: the fake drifts from real API behavior → mitigation: fake is minimal, mirrors only the exact calls and failure modes the impl uses.

## Risks / Trade-offs

- Fake handles may drift from Chromium's real FSA semantics → keep the fake minimal and behavior-faithful for exactly the calls the impl makes; e2e in task 6 is the backstop.
- `removeEntry({ recursive: true })` is not in older Chromium (pre-2022) → Chromium-first policy targets evergreen Chrome/Edge/Brave; acceptable.
- Picker requires a user gesture; `pickVaultFolder` throws if invoked outside one → the browser enforces this; task 5's button wiring satisfies it.
- Coverage gate (80% thresholds, istanbul): `fs.ts`'s branches must be exercised by the scenario tests → the test file maps to every scenario, which covers the branch surface; the fake's own branches are not instrumented—the fake lives in the test file or under the same import graph as the tests, keeping the report about `fs.ts` only.

## Migration Plan

No consumer exists yet; this is additive transport code with no runtime impact (nothing imports `src/vault/fs.ts`). No migration or rollback beyond reverting the change.

## Open Questions

None.