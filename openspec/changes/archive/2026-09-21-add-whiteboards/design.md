## Context

See proposal.md for motivation. The relevant current state:

- The vault splits into two kinds by path: `.md` under `pages/`/`journals/` is a page (`isPagePath`), everything under `assets/` is an opaque asset (ADR-0022). The index (`src/vault/index.ts`) builds `Graph.pages`, `Graph.byName`, `Graph.backlinks`, `Graph.files`, `Graph.assets` in one scan; `VaultStorage` is the only IO seam (ADR-0003, ADR-0013).
- The reference grammar is one regex (`REF` in `src/vault/parse.ts`) with two lexical forms; the index and the editor badge share it (ADR-0012).
- The main pane is a two-valued mode in `App.tsx` (`'page' | 'results'`) over a page-path key; the session trail (`src/history.ts`) stores page paths (page-history).
- The editor is Milkdown behind `EditorAdapter`; the vault layer holds no editor code (ADR-0010). `render-vault-images` resolves image bytes in the pane only.

The constraints that shape this design: Markdown is canonical (ADR-0001, ADR-0009); the keystroke path must not scale with vault or document size (AGENTS.md); no backend; the app stays small (ADR-0006).

## Goals / Non-Goals

**Goals:**

- A board is a vault file with a stable path, a reference token, a listing, and an editor.
- Adding boards changes nothing about how pages, journals, or assets behave.
- Typing in a page pays nothing for the feature beyond one extra alternative in an existing regex.

**Non-Goals:**

- No inline board rendering (proposal Non-goals).
- No board rename/move/delete; no camera persistence.
- No board content in search or the reference namespace for pages.

## Decisions

### D1. A board is a third file kind: `.excalidraw` under `boards/`

A path is a board when it ends in `.excalidraw` (case-insensitive), is under `boards/`, and has no hidden segment — the same shape as `isPagePath`. `Graph` gains `boards: string[]` (a filter over the `Graph.files` the scan already fetched, exactly like `listAssets`) and a `boardsByName` map over board stems. A `.excalidraw` outside `boards/` is an ordinary vault file: it opens (extension decides, D4) but is not listed.

Rejected: **boards under `assets/`.** It would reuse the asset listing, but the Assets section would then list a file it must not open as a copy or leave alone, and ADR-0022 would need an exception on every clause. `boards/` is symmetric with `pages/` and `journals/`, which is how the app already says "kind".

### D2. The board token is the page token with a `!`, parsed by the same machinery

`REF` gains one alternative ahead of the word form: `#!\[\[([^\]]+)\]\]` and `#!([\w-]+)` with `REF`'s existing lookbehind/lookahead guards. `findReferenceRanges` reports a `kind` of `'page' | 'board'`; `Link` gains a parallel board extractor. Resolution is a separate `boardsByName` map (D1), so a board name never collides with a page name and never reaches the page namespace.

This is why the grammar is "mirror pages": the parser, the completion trigger (`#!` / `#![[`), and the badge are the same code paths with a discriminator, not a second subsystem.

Rejected: **`#[[name.excalidraw]]`** (name-shape rule, ADR-0019 style). It would make every reference inspect its name's suffix at parse time to pick a target kind, and a board reference would read like a page reference.

Rejected: **a single wrapper `#!<<name>>`.** One wrapper already holds any name, but the page forms give `#!word` / `#![[...]]` for free and keep one grammar.

Collision check: `#!` requires a name character immediately after it, so `#!/bin/bash` is not a reference; prose containing `#!word` becomes a board reference. Documented as a risk.

### D3. Board creation is delayed, like a page

A token whose board file is absent opens a blank board in the pane and writes `boards/<name>.excalidraw` on the first save — the unmaterialized-page rule (static-navigation), reusing `VaultStorage.write`. Nothing is created on open, so a typed token leaves no orphan.

### D4. The extension decides the view

The board open route lives in the vault layer beside `openVaultTarget` (ADR-0010): a vault path ending in `.excalidraw` routes to "open board" rather than a `blob:` window. Callers are the badge, a Markdown link, a Boards row, and a search result.

### D5. The main pane gains a third mode; the trail stores entries

`App`'s mode becomes `'page' | 'results' | 'board'`, and the open thing becomes a discriminated value `{ kind: 'page' | 'board', path }`. `history.ts` stores entries with a kind, so Back/Forward can reopen a board. The meta panel has no page metadata in board mode, so `App` passes the board's referrers instead (D9). The status bar's path group takes either path.

Rejected: **a modal or a `blob:` window.** A modal hides page context and fights the band/scroll layout; a `blob:` window is a copy and cannot write back (ADR-0021). The main pane is already the app's transient-mode host (ADR-0005).

### D6. Excalidraw loads lazily and stays out of the offline install

`@excalidraw/excalidraw` is imported only from the board view module, by dynamic `import()`, so Vite emits it as its own chunk with its CSS. `vite.config.ts` excludes that chunk (and its fonts) from the Workbox precache glob, so installing the PWA does not download a board editor the vault may never use; the cost is paid on the first board open. The board view sets the package's asset path so its fonts resolve under Vite's `base`. A spike confirms the asset path and font wiring before the rest is built.

Rejected: **a static import.** It would add ~2.9 MB to the initial bundle and the precache for every user.

### D7. Only element changes save, and the save is debounced

The board view subscribes to Excalidraw's change callback, ignores changes whose only delta is `appState` camera fields, and writes `serializeAsJSON(elements, appState, files)` through a debounced saver shaped like the page saver (`src/editor/saver.ts`). The camera is not document content and is not persisted. The board scene is a text JSON blob, so it writes through `VaultStorage.write`; any pasted images ride in the scene's `files` map.

### D8. Layers

```
  vault layer (pure, editor-agnostic)         editor layer
  --------------------------------------      ---------------------------------
  parse.ts   -> board tokens (kind)           referenceSuggest / badge: the
  index.ts   -> boards[], boardsByName,          #! trigger and board badge
                boardReferrers[]               boardView.ts: Excalidraw host
  assetOpen.ts -> .excalidraw -> open board
  link/parse -> the board open route
  --------------------------------------      ---------------------------------
                    App.tsx composes: mode, routing, trail, panel, status bar
```

Board tokens are pure string rules (vault layer); the Excalidraw host is editor layer; `App` wires them. Board bytes never pass through the index.

### D9. The index exposes boards and board referrers

`Graph.boards` is the path-ordered `boards/` listing; `Graph.boardsByName` resolves a token name to a path; `boardReferrers` maps a board path to the pages whose content holds a resolving token. This is the page-backlink inversion applied to board tokens, computed in the same `fold` pass. Search adds boards as title-only documents (empty `text`) through the existing corpus.

### D10. ADR work

- **Amend ADR-0006**: its "out of scope" list names whiteboards; record that a board is now in scope, and why.
- **Amend ADR-0012**: "one namespace: pages" becomes two reference kinds (page and board), distinguished by the `#!` marker.
- **New ADR**: the board file kind — a non-Markdown document the app parses, edits, and writes, under `boards/`, outside the page and asset categories.
- ADR-0022 is untouched: a board is not an asset.

## Risks / Trade-offs

- **`#!word` in existing prose becomes a reference** → `#!` requires a name character, so shebangs and paths do not match; the residue is prose deliberately containing `#!word`. Documented; the form is Folio's own (ADR-0012).
- **A ~2.9 MB lazy chunk and its fonts** → dynamic import, precache exclusion, paid on first open (D6).
- **Excalidraw asset-path/font wiring under Vite's `base`** → a spike first, before the feature is built on it.
- **Save churn from camera changes** → element-only diff, debounce (D7).
- **Large board files** → the scene write is text through `VaultStorage`; the board never enters a page parse, search corpus, or the typing path, so the keystroke budget (`AGENTS.md`) is untouched.
- **Serialization round-trip fidelity** → save exactly what the editor holds via `serializeAsJSON`; nothing is re-derived.
- **Keystroke-path growth** → one extra `REF` alternative per page scan (scan-time, not keystroke-time); the badge pass is unchanged in shape.
- **Two reference kinds in the badge/reference-suggest code** → one discriminator, shared regex, no second subsystem (D2).
- **A board's Referenced by misses path-link references** → deliberate: only the token is the graph reference (spec: extension decides the view); a path link shows in References like any file.
- **Board name that is not a valid filename** → the token form is restricted the way a reference name is (`isReferenceable`-style rule); such a name creates no board.

## Open Questions

- Whether the Boards section should be open by default in a vault that has boards (spec says collapsed) — a one-line change, no spec/approach impact.
- Whether a board's Referenced by should also count path links — deferred; would not change the approach.
