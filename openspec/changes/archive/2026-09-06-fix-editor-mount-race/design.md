## Context

`EditorPane` (keyed by page path) owns the mount element and the adapter lifecycle; `MilkdownAdapter.mount` awaits `Editor.create()` before assigning `this.editor` (see proposal.md — Why). Under StrictMode, React runs mount → cleanup → mount synchronously, so cleanup's `destroy()` sees `this.editor === null`, no-ops, and the first `create()` later renders an orphaned, empty `.milkdown` div. The pane's own `cancelled` flag already skips `setContent` on the stale adapter — the leak is purely the not-yet-created editor never being destroyed.

## Goals / Non-Goals

**Goals:**
- `destroy()` neutralizes an in-flight `mount()` so a cancelled editor tears itself down when its `create()` resolves.
- Exactly one `.milkdown` root per open page, including StrictMode double-mount and rapid page switches.

**Non-Goals:**
- No change to the pane component or App wiring (the pane's `cancelled` guard already works).
- No change to the round-trip Markdown normalization (inherent to WYSIWYG, ADR-0008).

## Decisions

**D1 — Adapter-owned cancelled flag.** `MilkdownAdapter` gains a private `destroyed` flag: `destroy()` sets it (and awaits any already-created editor), and after `create()` resolves, `mount()` checks it — if set, it awaits `editor.destroy()` and returns without wiring listeners, `latest`, or `this.editor`. Rationale: the lifecycle authority already lives in the adapter (`destroy()` must be safe on any mount state — it is the seam's contract, D1 of the milkdown-editor change). Alternative rejected: fixing it in the component (a ref holding the pending editor) would duplicate lifecycle ownership across two layers for no behavioral gain.

**D2 — Component stays as-is.** `EditorPane`'s `cancelled` flag + `void adapter.destroy()` already pairs correctly with the fixed adapter; the deferred `destroy()` the component fires covers the not-yet-created case, which D1 makes safe.

**D3 — Regression tests use the real adapter in jsdom.** A StrictMode render of `EditorPane` (real `MilkdownAdapter`) asserts a single `.milkdown` root and seeded content — the same environment as the pass/fail reproduction (the adapter boots in jsdom, verified in milkdown-editor). The rapid-switch case asserts teardown of a pending mount via a deferred `create`. Tests sit in `editor/` alongside the adapter's existing tests.

## Risks / Trade-offs

- [Timing assumption: `Editor.create()` in jsdom always resolves after cleanup runs] → The tests assert behavior, not timing; StrictMode's synchronous mount-cleanup-mount guarantees the ordering in the test as it does in dev.
- [The destroyed-editor path depends on Milkdown's `destroy()` removing its own DOM] → verified behavior of `Editor.destroy()` v7; the test's single-root assertion covers it.