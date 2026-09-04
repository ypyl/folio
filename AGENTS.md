# AGENTS.md

**Folio** — a lightweight, local-first Logseq alternative: open a local Markdown folder in the browser; the folder is the database, the app is just a UI + index over it. No backend, no app database.

## Stack

Vite + React + TypeScript, Chromium-first PWA (File System Access API), Milkdown editor, Fuse.js search, oxlint.

## Architecture

The Markdown folder is the source of truth. Filesystem access sits behind a `VaultStorage` interface; the vault is indexed in memory on open and updated incrementally. Read `adr/README.md` before touching core architecture.

## Rules

- **All changes go through OpenSpec.** Features, fixes, docs, refactors: propose → apply → update → archive (`/opsx-propose` first). Never implement directly.
- **Keep it small.** The simplicity is the product — no backend, no feature creep, no rebuilding Logseq (ADR-0006).
- **Markdown is canonical.** App state must be derivable from the `.md` files; derived data only in cache (ADR-0001, ADR-0009).
- **Keep boundaries.** Filesystem access via `VaultStorage`; editor separate from knowledge-management logic (ADR-0003, ADR-0010).
- **Use `DESIGN.md` for all styling.** Tokens, colors, spacing, and UI rules live there; read it before any UI or styling work.
- **No migration compatibility.** Folio is a new app. Its reference forms are `[[Page]]`, `#word`, `#[[Page]]`; other tools' conventions are not parsed as features (ADR-0012).
