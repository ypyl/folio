## Context

`EditorPane`'s reset-to-top effect runs on `[page]` — the object reference. The active folder's index is a disposable graph (ADR-0004): the app's own save runs `upsertPage`, rebuilding the graph and producing a new `IndexPage` object for the same path on every refresh. The effect was meant to reset scroll on page switch only; the reference dep fires on every rebuild (see proposal.md — Why).

## Goals / Non-Goals

**Goals:**
- Pane scroll position survives saves and index refreshes on the same page.
- Page switches still reset scroll to the top.

**Non-Goals:**
- No change to cursor/setContent behavior (the editor never remounts on save — `key={page.path}`).
- No change to the index or save pipeline.

## Decisions

**D1 — Re-key the reset effect on the stable selector.** Change the effect's dependency from `[page]` (object ref, changes on every graph rebuild) to `[page?.path]` (the selection identity — changes only on a real page switch). Rationale: the panel's scroll reset is a navigation behavior; `path` is the navigation identity (ADR-0013, path-keyed index). Alternatives rejected: a "was reset on switch" ref to blindly re-lock scrollTop after every render — extra state that the dep fix already makes unnecessary; moving the reset into `handleSelect` (App) — couples App to pane scroll details.

**D2 — Regression test in `EditorPane.test.tsx`.** jsdom treats `scrollTop` as a plain mutable property, so the test sets the pane's `scrollTop`, re-renders with a new page object of the same path, and asserts it is preserved; then re-renders with a different path and asserts reset to `0`. The fake-editor harness (design D1 of milkdown-editor) is reused — no real adapter needed for scroll behavior.

## Risks / Trade-offs

- [Effect dep semantics: `page?.path` also covers the null-page case] → When `page` is `null`, path is undefined and never triggers; the empty state has its own layout and no scroll reset is needed.