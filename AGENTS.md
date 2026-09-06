# AGENTS.md

**Folio** — a lightweight, local-first Logseq alternative: open a local Markdown folder in the browser; the folder is the database, the app is just a UI + index over it. No backend, no app database.

## Stack

Vite + React + TypeScript, Chromium-first PWA (File System Access API), Milkdown editor, Fuse.js search, oxlint.

## Architecture

The Markdown folder is the source of truth. Filesystem access sits behind a `VaultStorage` interface; the vault is indexed in memory on open and updated incrementally. Read `adr/README.md` before touching core architecture.

## Rules

- **OpenSpec for features and behavior changes.** Any change that adds, redefines, or alters observable app behavior — a new capability or requirement, or a change to how the app renders, routes, writes, or responds (functional or non-functional) — goes propose → apply → update → archive (`/opsx-propose` first); never implement directly. Everything else is done directly, in small self-contained commits: refactors, small fixes, bug fixes that restore already-intended behavior, docs, test-only changes. If a user could notice a different outcome, it's OpenSpec; if it just restores intended behavior or polishes internals, it's direct.
- **Keep it small.** The simplicity is the product — no backend, no feature creep, no rebuilding Logseq (ADR-0006).
- **Markdown is canonical.** App state must be derivable from the `.md` files; derived data only in cache (ADR-0001, ADR-0009).
- **Keep boundaries.** Filesystem access via `VaultStorage`; editor separate from knowledge-management logic (ADR-0003, ADR-0010).
- **Use `DESIGN.md` for all styling.** Tokens, colors, spacing, and UI rules live there; read it before any UI or styling work.
- **No migration compatibility.** Folio is a new app. Its reference forms are `#word` and `#[[Page]]`; plain `[[Page]]` and other tools' conventions are not parsed as features (ADR-0012).
