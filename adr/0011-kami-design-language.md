# ADR-0011: Adopt the Kami design language for Folio's visual identity

- Status: Accepted
- Date: 2026-09-03

## Context

Folio needed a visual identity for its PWA icons and launcher surfaces. The first draft used an indigo palette (`#6366f1`) that was chosen ad hoc and did not reflect what the product is: a local-first Markdown vault, where plain `.md` files on disk are the database (ADR-0001). The project's convention is to keep everything small and self-consistent (ADR-0006), and the UI should feel like the folder-of-paper it actually manages.

[Kami](https://github.com/tw93/Kami) is a constraint-driven design system for paper documents. Its whole aesthetic is built around a single readable sentence: *warm parchment canvas, ink-blue accent, serif carries hierarchy, avoid cool grays and hard shadows.* That aesthetic matches Folio's domain (Markdown notes, documents, a folder of paper) better than a generic SaaS indigo.

## Decision

Adopt Kami's design language as Folio's visual identity, starting with the PWA icon and launcher surfaces.

Design tokens (from Kami's `design.md`):

| Token | Value | Use |
|-------|-------|-----|
| `--brand` | `#1B365D` ink-blue | The only chromatic color. App icon background, theme color |
| `--brand-light` | `#2D5A8A` | Brighter variant for details on dark surfaces |
| `--parchment` | `#f5f4ed` | Warm paper surface. Never pure white |
| `--ivory` | `#faf9f5` | Quiet filled container |

Rules in force:

- **One chromatic color.** Ink-blue is the only accent. No second hue.
- **Warm paper, never pure white.** Surfaces use parchment `#f5f4ed`; pure `#ffffff` is banned as a surface.
- **Warm grays only.** Any gray has a yellow-brown undertone; cool blue-grays (`#f8f9fa`, `#f3f4f6`) are banned.
- **Flat surfaces, whisper shadows.** No hard drop shadows or gradients on surfaces.
- **Restraint over ornament.** A detail stays only if it communicates something (the page form, the facet lines).

The icon is the prism mark: ink-blue rounded square, a parchment diamond (the paper), and an ink-blue page with parchment text lines and a folded corner. The diamond and crosshair evoke indexing and organization — the vault's in-memory index (ADR-0004) — while the parchment registers warmth and "paper", not "cloud app".

Launcher surfaces:

- Manifest `theme_color`: `#1B365D`, `background_color`: `#f5f4ed` (was `#6366f1` / `#ffffff`).
- `<meta name="theme-color">`: `#1B365D`.

The Chrome-browser theme-color / PWA window chrome now matches the icon instead of fighting it.

## Consequences

- The icon and launcher now carry a coherent visual identity tied to the product's domain (paper, folders, notes) instead of an arbitrary hue.
- The tokens are a foundation: the in-app UI (three-pane layout, ADR-0005) can later adopt parchment/ink-blue/serif without a re-derivation.
- Typography is intentionally **not** adopted here. Kami's serif-first, print-tight type scale is for documents; the app UI remains a screen UI. If the app later adopts the full Kami type system, that is a separate ADR.
- The design language comes with hard constraints (one accent, no pure white, warm grays only) that future UI work must obey; violations should be treated as scope/convention issues, not stylistic preferences.