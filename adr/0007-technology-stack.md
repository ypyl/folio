# ADR-0007: Technology stack: Vite, React, TypeScript, no backend

- Status: Accepted
- Date: 2026-09-03

## Context

Folio is a local-first PWA (ADR-0001, ADR-0002) with a deliberately small scope (ADR-0006). The stack must be fast to develop in, type-safe, and browser-native — with no server component.

## Decision

- **Vite** as the build tool and dev server (project scaffolded with Vite 8, React + TypeScript template).
- **React** + **TypeScript** for the UI.
- **PWA** via `vite-plugin-pwa` for installability and offline boot.
- **`react-markdown`** + **`remark-gfm`** for reading Markdown (wikilinks/tags parsing sits on top).
- **Fuse.js** for full-text search.
- **No backend.** No database infrastructure, per ADR-0001.
- IndexedDB is optional for caching the index (ADR-0004), not a product feature.

## Consequences

- Purely static frontend: can be hosted anywhere or run as a PWA; no deployment surface.
- File System Access API usage (Chromium-only) is consistent with ADR-0002.
- Library choices are replaceable; the parsing/indexing logic behind them is owned by Folio.
- Editor/rendering choice updated by ADR-0008: Milkdown replaces `react-markdown` + `remark-gfm` as the primary editing/rendering surface.