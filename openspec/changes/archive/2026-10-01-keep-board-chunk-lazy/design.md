# Design

## Context

See `proposal.md` — Why.

- The board chunk is assembled by `build.rollupOptions.output.manualChunks` in `vite.config.ts`, matching `@excalidraw/`, `@mermaid-js/`, `mermaid/`, `cytoscape`, and `katex` under `node_modules`, and naming the group `excalidraw`.
- Vite 8 runs on rolldown 1.2.7. In rolldown, the legacy `manualChunks` becomes a single code-splitting group, and a group captures its captured modules' dependencies recursively (`includeDependenciesRecursively` defaults to `true`).
- That recursion is the defect: the board graph's dependencies include `react`/`react-dom` (Excalidraw's peer dependency), `dompurify` (mermaid), and Vite's preload helper, all of which the entry itself needs. Recursive capture wrote them into the board group, so the entry imported the board chunk and `index.html` module-preloaded it.
- The board chunk's name is load-bearing: `vite-plugin-pwa`'s Workbox config excludes `excalidraw-*.js` / `.css` from the precache by that pattern.

## Goals / Non-Goals

**Goals**

- The entry chunk does not import the board chunk; `index.html` does not preload it; the board editor is fetched on first board open.
- The board chunk stays a single, deterministically named `excalidraw` chunk, excluded from the offline install, with its board-only dependencies riding inside it (so they do not leak into the precache as separately named chunks).

**Non-Goals**

- The CodeMirror language catalog (separate change).
- Any board, editor, or `src/` behavior change.

## Decisions

### D1. Move to `codeSplitting`, keep recursive capture for the board, and lift the shared modules into a higher-priority `vendor` group

Replace `output.manualChunks` with `output.codeSplitting.groups` and define two groups:

- `vendor` (priority `10`, `includeDependenciesRecursively: false`): the modules both graphs use — `react`, `react-dom`, `scheduler`, `dompurify`, `@floating-ui`, `lodash-es`, `clsx`, `nanoid`, and Vite's preload helper (`\0vite/preload-helper.js`).
- `excalidraw` (default priority, `includeDependenciesRecursively: true`): the board packages, capturing their board-only dependencies so those ride in the excluded chunk.

The higher-priority group removes the shared modules from the board group, so the entry imports `vendor` (which it loads anyway) rather than the board chunk; the board chunk keeps every board-only dependency, so the precache stays clean.

Alternatives considered:

- **`includeDependenciesRecursively: false` on the board group alone.** It fixed startup, but board-only dependencies split into 28 separately named chunks that Workbox then precached (~537 KiB, 144 → 172 entries). Rejected for the install regression.
- **Blacklisting only `dompurify`.** Insufficient: React and the preload helper are shared too.
- **Dropping grouping entirely.** Loses the deterministic `excalidraw` name the precache exclusion keys on.

### D2. Keep the deterministic chunk name

The board group keeps `name: 'excalidraw'`, so the Workbox `globIgnores` patterns and the design D6 exclusion keep working unchanged.

### D3. Verify from build output, not a unit test

The requirement is about the emitted bundle, which the vitest run does not produce. Verification is: the entry chunk has no static import of the board chunk, `dist/index.html` has no `modulepreload` for it, and `dist/sw.js` excludes it with no new board-only chunks.

## Risks / Trade-offs

- **The shared list must be maintained.** If the app later shares a new dependency with the board graph, the entry could start importing the board chunk again. Guard: the build check (the entry must not statically import `excalidraw-*.js`), asserted in the task's verification.
- **Recursive capture must stay on for the board group.** Turning it off reintroduces the precache leak. Guard: the precache check (entry count and board-only chunks) in the task's verification.
- **Moving React into `vendor` adds one precached chunk** (~30 KiB gzip net) while removing it from the main chunk; the net entry payload is unchanged and the board chunk leaves the startup path.

## Migration Plan

One commit: the `vite.config.ts` change plus the version bump. Rollback is `git revert`; the build config is self-contained and nothing under `src/` changes.
