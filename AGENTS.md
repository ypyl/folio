# AGENTS.md

Guidance for AI agents (and humans) working in this repository.

## Project

**Folio** — a lightweight, local-first alternative to Logseq. You open a local Markdown folder (vault) in the browser; the folder is the database, the app is just a UI + index over it. No backend, no application database.

## Change Workflow (OpenSpec)

All changes to this project — features, fixes, docs, refactors — go through **OpenSpec**'s spec-driven workflow. Never implement directly; every change is proposed, applied, and archived as a spec.

Start a change from the agent prompt:

```text
/opsx-propose "your idea"
```

OpenSpec commands (present in `.pi/`, also usable directly):

| Command | Purpose |
|---------|---------|
| `/opsx-propose` | Turn an idea into a spec-driven change (plan: requirements, design, tasks) |
| `/opsx-apply` | Implement an accepted change against its spec |
| `/opsx-update` | Update a change's spec after feedback or drift during implementation |
| `/opsx-archive` | Archive a completed change |
| `/opsx-explore` | Explore the spec/change set |
| `/opsx-sync` | Sync OpenSpec specs (e.g., from remote) |

Config: `openspec/config.yaml` (`schema: spec-driven`). Specs live organized by `openspec/`; the exact layout is managed by OpenSpec itself. General workflow: **propose → apply → update → archive**. When in doubt, follow the relevant skill in `.pi/skills/openspec-*/`.

## Commands

```bash
npm install        # install dependencies
npm run dev        # start dev server (http://localhost:5173)
npm run build      # type-check (tsc -b) + production build to dist/
npm run preview    # preview the production build
npm run lint       # oxlint
npm run gen:icons  # regenerate placeholder PWA icons (node scripts/gen-icons.mjs)
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Build tool | Vite 8 |
| UI | React 19 + TypeScript (TS 6) |
| PWA | `vite-plugin-pwa` — auto service worker (Workbox `generateSW`), manifest injected into `index.html` |
| Filesystem | File System Access API (`showDirectoryPicker`) — **Chromium-first:** Chrome, Edge, Brave |
| Editor | Milkdown (WYSIWYG Markdown) — planned, see ADR-0008 |
| Search | Fuse.js — planned |
| Linting | oxlint |

Browser data is stored local-first: no server, no external dependencies at runtime. The PWA must precache assets (see `vite.config.ts`, `public/`).

## Project Layout

```text
src/         React app (entry: src/main.tsx)
public/      Static assets incl. PWA icons (pwa-192x192.png, pwa-512x512.png, manifest icons)
scripts/     Tooling (gen-icons.mjs — placeholder icon generator)
openspec/    OpenSpec config + specs (spec-driven change workflow, see below)
.pi/         Agent commands: opsx-* prompts and openspec-* skills (installed by `openspec init --tools pi`)
research/    Raw design docs / discussions behind decisions
adr/         Architecture Decision Records (numbered, MADR-style)
```

### `research/` — design documents

Raw, longer-form write-ups that motivated decisions:

- `01-project-discussion.md` — original project spec: goal, scope, architecture, UI, browser-compat position, MVP list
- `02-markdown-editor-milkdown.md` — editor decision: Milkdown, why not a custom editor, why not BlockNote

These are narrative documents, not the normative record. If a decision in `research/` isn't yet an ADR, consider extracting one (see below).

### `adr/` — Architecture Decision Records

The normative record of decisions. One file per decision, MADR-style template:

```text
# ADR-XXXX: Title
- Status: Accepted | Proposed | Superseded
- Date: YYYY-MM-DD
## Context / ## Decision / ## Consequences
```

Read the ADR index (`adr/README.md`) before touching core architecture. Key records:

- **0001** The Markdown folder is the database (source of truth, no backend)
- **0002** Chromium-first PWA using the File System Access API
- **0003** Filesystem access behind a `VaultStorage` interface (PWA → Tauri path)
- **0004** In-memory vault index, rebuilt on open, updated incrementally
- **0006** Scope guardrails: do not rebuild Logseq
- **0008** Use Milkdown as the Markdown editor
- **0009** Keep Markdown canonical — reject block-based editing
- **0010** Editor separated from the knowledge-management layer

### Adding a new ADR

1. Copy the next free number in `adr/` (`0011-...`).
2. Fill in Status, Date, Context, Decision, Consequences.
3. Add a row to the index table in `adr/README.md`.

## Conventions

- **Keep it small.** The simplicity is the product (ADR-0006). Do not introduce a backend, database, or Logseq-like feature creep.
- **Markdown is the source of truth.** Any app state must be derivable from the `.md` files (ADR-0001, ADR-0009). IndexedDB may only cache derived data.
- **Keep boundaries.** Filesystem access goes through `VaultStorage` (ADR-0003); editor and knowledge-management logic stay separate (ADR-0010).
- **All changes go through OpenSpec.** No direct edits outside the propose → apply → update → archive cycle (`/opsx-propose` first).