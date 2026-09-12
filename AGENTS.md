# AGENTS.md

**Folio** — a lightweight, local-first Logseq alternative: open a local Markdown folder in the browser; the folder is the database, the app is just a UI + index over it. No backend, no app database.

## Stack

Vite + React + TypeScript, Chromium-first PWA (File System Access API), Milkdown editor, Fuse.js search, oxlint.

## Architecture

The Markdown folder is the source of truth. Filesystem access sits behind a `VaultStorage` interface; the vault is indexed in memory on open and updated incrementally. Read `adr/README.md` before touching core architecture.

## Rules

- **OpenSpec for features and behavior changes.** Any change that adds, redefines, or alters observable app behavior — a new capability or requirement, or a change to how the app renders, routes, writes, or responds (functional or non-functional) — goes propose → apply → update → archive (`/opsx-propose` first); never implement directly. Everything else is done directly, in small self-contained commits: refactors, small fixes, bug fixes that restore already-intended behavior, docs, test-only changes. If a user could notice a different outcome, it's OpenSpec; if it just restores intended behavior or polishes internals, it's direct.
- **Keep it small.** The simplicity is the product — no backend, no feature creep, no rebuilding Logseq (ADR-0006).
- **Editor responsiveness is a budget.** Typing must stay imperceptible however big the vault or the open document gets. A keystroke may make one pass over already-built in-memory data (the open document, a memoized index or candidate pool), but must not re-parse, re-serialize, re-sort, rebuild, or re-read from disk in proportion to vault or document size, and must not allocate per visited item. Anything that scales with vault or document size carries its measurement in the change's design. Derived data (index, search corpus, suggestion pools) is rebuilt only when its input identity changes, never per keystroke, and filesystem access never sits on the typing path. Per-transaction hooks (`apply`, `onChange`, `view.update`, decorations) short-circuit on a reference-equality check when nothing relevant changed. Every feature review answers: what does this add to the keystroke path, and what does that cost scale with?
- **Markdown is canonical.** App state must be derivable from the `.md` files; derived data only in cache (ADR-0001, ADR-0009).
- **Keep boundaries.** Filesystem access via `VaultStorage`; editor separate from knowledge-management logic (ADR-0003, ADR-0010).
- **Use `DESIGN.md` for all styling.** Tokens, colors, spacing, and UI rules live there; read it before any UI or styling work.
- **No migration compatibility.** Folio is a new app. Its reference forms are `#word` and `#[[Page]]`; plain `[[Page]]` and other tools' conventions are not parsed as features (ADR-0012).
- **Bump the version every commit.** Increment `version` in `package.json` as part of each commit, so every commit is a distinct running build and the header badge (`v<version>`) names the build that is live. A patch bump for fixes, refactors, and docs; a minor bump for a new user-facing capability. The version is build identity, not a release schedule.
- After making code changes, run `npx oxlint --fix`, then `npm run fmt` (oxfmt formats `src/`).
- Before finishing, run `npx oxlint --deny-warnings --format=agent`.
