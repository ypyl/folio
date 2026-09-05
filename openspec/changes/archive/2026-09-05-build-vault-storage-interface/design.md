# Design: build-vault-storage-interface

## Context

See proposal.md — Why. Current state: the app runs entirely on `src/mockVault.ts` (imported only by `App.tsx`); there is no `src/vault/` yet. ADR-0003 sketches `read(path) / write(path, content) / delete(path) / list(path): Promise<Entry[]>` but never defines `Entry`. ADR-0004 keys its index by `path: string`. The next PLAN steps (4: FSA impl, 5: open folder, 6: scan+index) consume this interface, so it is designed against those consumers, nothing earlier.

## Goals / Non-Goals

Goals:
- A types-only seam in `src/vault/` that task 4 can implement and task 6 can consume
- The path contract settled now so task 4 + task 6 agree without rework

Non-goals (design-level additions to the proposal's):
- No runtime code at all in this change — zero consumers exist, and `mockVault.ts` stays until PLAN task 6
- No error-type module, no binary support, no watcher (see Decisions + Risks)

## Decisions

**D1 — `list` returns flat, recursive `string[]`.** All files at any depth, root-relative; directories never appear. Replaces the ADR's undefined `Entry[]`. Alternative considered: `{ path, kind }[]` shallow entries with the caller walking — rejected because no consumer in the plan wants a shallow look or directory entries; the walk would just be duplicated logic that task 4's FSA impl must do anyway. Consumers filter (`endsWith('.md')`, `startsWith('journals/')`).

**D2 — Path contract: root-relative, `/`-separated, no leading `/`, no `..`, no absolute; `''` = root.** Alternative considered: letting implementations define paths — rejected: ADR-0004's index keys must be stable, and two impls emitting different path shapes would break it. Validation rejects (`..` etc.), never sanitizes — a wikilink-derived filename (future, ADR-0012) containing `..` must not silently escape the vault root.

**D3 — Errors reject, never `null`; no error-type module.** `read`/`delete` of a missing file reject with the underlying error (FSA's `NotFoundError`). Alternative considered: a normalized `VaultError` set — rejected now because there is exactly one runtime (Chromium), DOMException names are stable, and no plan consumer branches on error kinds. Add the error set when a consumer actually needs to branch.

**D4 — Text-only interface.** `read`/`write` operate on strings. PLAN task 8 (assets) needs binary; it extends the interface additively (`readBuffer`/`writeBuffer`) when it lands — FSA serves both from the same handle, so no contract rework.

**D5 — Types-only delivery: `src/vault/storage.ts`** exports the interface + path contract; no implementation file. Alternative considered: including an `InMemoryVaultStorage` now — deferred to PLAN task 4/5 planning, where the mock-to-real graduation is actually designed; no consumer exists yet.

**D6 — New ADR-0013 records the contract; ADR-0003 keeps its role.** The exploration settled decisions that outlast the code: path rules are a trust boundary (future wikilink-derived filenames must not escape the vault via `..`), `/`-keys keep ADR-0004's index implementation-stable, and "reject, no error module" is a decision later engineers would re-argue. So the contract earns a new numbered ADR (ADR-0013) with context and alternatives; ADR-0003 stays as-is except a one-line pointer. Alternatives considered: amending 0003 with the full contract — rejected: it bloats a one-page "there is a seam" decision and rewrites an accepted ADR's code block, which blurs when the contract was actually decided; and no ADR at all (the spec already states the what) — rejected: the *why* (security + cross-ADR coupling) is exactly what ADRs exist to keep.

## Risks / Trade-offs

- [Istanbul coverage gate] A types-only module has no executable statements; vitest's always-on 80% thresholds might count it as uncovered → Mitigation: verification item in tasks; if it trips, one-line `exclude` entry in `vitest.config.ts` for the type-only file, or a trivial exported const guard.
- [Contract drifts if task 4 ignores it] The interface is only as good as the FSA impl's fidelity → Mitigation: the spec's scenarios (nested write, missing-file reject, invalid-path reject) are the acceptance gates for task 4.
- [Writing creates parent dirs adds FSA work] The "write creates missing parents" requirement makes task 4's ensure-dir walk non-trivial → Mitigation: correct call — PLAN task 10 journal creation relies on it; task 4 absorbs the walk.

## Migration Plan

None — additive types-only change; removes nothing, touches no consumers. Rollback = delete `src/vault/` if it ever shipped code; not applicable.

## Open Questions

- None blocking. Mock page-content details for FUTURE fixture reuse were already settled in the static-navigation change; this change doesn't author content.