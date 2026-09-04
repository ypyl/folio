# Design: build-ui-shell

## Context

The app is the Vite starter template: hero page, counter, purple accent, white background, cool grays, dark-mode block — every element off-palette per `DESIGN.md`'s adoption table. This change replaces it entirely with the Kami-styled Folio shell. Motivation and scope: see `proposal.md`. Requirements: `specs/ui-shell/spec.md`. All layout decisions (header search, accordion sidebar, meta panel, empty state, button variant) were settled during exploration and recorded in ADR-0005 (revised) and ADR-0012.

## Goals / Non-Goals

**Goals:**
- Full Kami token migration in one step (the template's palette is unrecoverable — replace, not retrofit)
- A zero-state shell: no app state, no router, no data — pure composition and CSS
- Structure that later steps land into without rework (header slot, accordion sections, pane scroll)

**Non-Goals:**
- No editor, storage, navigation, mock data, calendar, search behavior, dark mode, or responsive collapse (see proposal Non-goals)

## Decisions

### 1. Token migration: verbatim Kami tokens, template deleted
Replace the entire `:root` block with the Kami tokens from `DESIGN.md` — same token names and values (e.g. `--parchment: #f5f4ed`). Delete the template's `--accent`, cool-gray text vars, `color-scheme: light dark`, and the whole `@media (prefers-color-scheme: dark)` block; set `color-scheme: light`. Template Chrome (`#root` centered card, `border-inline`) is removed — `#root` becomes a full-viewport grid container.
- *Alternative rejected*: additive migration (keep template vars, layer Kami on top) — leaves banned values in the stylesheet, the violation the change exists to remove.

### 2. Role → token map (the deliverable that makes "use the tokens" concrete)
Kami tokens are materials, not roles; this map is the reference every component styles against:

| Visual role | Token |
|---|---|
| Page background (viewport, workspaces) | `--parchment` |
| Shell header background | `--parchment` |
| Pane/accordion surfaces (quiet containers) | `--ivory` |
| Interactive hover surface | `--warm-sand` |
| New Page button fill | `--warm-sand` (`--border` edge, `--dark-warm` text) |
| Primary text | `--near-black` |
| Secondary text / links | `--dark-warm` |
| Placeholder / meta text | `--stone` |
| Section dividers, header hairline | `--border` |
| Focus ring | `--brand` outline, `--brand-tint` glow |
| Brand accents (active states, marks) | `--brand` / `--brand-light` |

### 3. Layout: two stacked grids
`App` renders a header row and a workspace grid, both on `100svh`-rooted rows (`grid-template-rows: auto 1fr`). The workspace is `grid-template-columns: 240px minmax(0, 1fr) 220px` with per-pane `overflow-y: auto` (panes scroll, page never does). The header is a second grid mirroring the same column widths — `240px minmax(0,1fr) 220px` — so the search input aligns over the center pane (openspec-viewer's pattern; the alternative, margin-auto centering, aligns to the viewport). Long titles: `minmax(0, 1fr)` + ellipsis so a long page name can't crush the center pane.

### 4. Accordion: native `<details>`, one thin wrapper
Collapsible sections use `<details>/<summary>` — semantic, keyboard-accessible, zero JS. Sections are independent (no `name` attribute; Journal and Pages may both be open). Smooth open/close via `interpolate-size: allow-keywords` (Chromium 129+, acceptable for Chromium-first; degrades to instant toggle elsewhere). Custom chevron in `summary::after`, rotated on `[open]`. One `Accordion` component (`title`, `defaultOpen`, `children`) — a thin wrapper so later steps can drive `open` via ref without rework.

### 5. Header
`Header | Sidebar | EditorPane | MetaPanel` components. Brand left: `FolioMark` (small, existing SVG component) + "Folio". Center: inert search input — no handlers, no results element — rendered solely so the layout exists (per decision, it is visibly present but dead until the search step). Right slot: empty container, reserved for the open-folder action (storage step).

### 6. Empty state
Brand screen in the center pane: `FolioMark` large, `role="presentation"`/`aria-hidden` (decorative — FolioMark's existing convention), one tagline line in `--stone`. No button. It is transient by composition: it renders only while no page is open, and nothing in this change can open a page.

### 7. Focus
Global base rule: `:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px }` on all interactive elements — visible by default, no per-component focus code needed.

### 8. Stylesheet organization
`src/index.css` holds tokens, reset/base, app-level layout (`.app-shell`, `.workspace`), and shared utilities (`.btn-secondary`, `.section-placeholder`). Every component carries its own `*.module.css` alongside it (Vite's built-in CSS modules, typed via `vite/client`), so component styles are scoped and colocated. CSS modules was chosen over the earlier single-file plan after the shell landed, per user direction: tokens and shared die stay global, everything else is scoped.

## Risks / Trade-offs

- [Banned values survive anywhere in `src/`] → acceptance gate: grep for `#fff` surfaces, `#f8f9fa`, `#f3f4f6`, `#aa3bff` before finishing apply
- [Inert search input reads as broken to some users] → accepted by explicit product decision (the header layout is the design; behavior is a later step). Tagline and placeholder remain honest ("Search arrives with the search step" is deliberately not added — the input is quiet, not labeled as missing)
- [`interpolate-size` not animating on older Chromium] → cosmetic only; toggle still works
- [Fixed side widths + long titles] → `minmax(0,1fr)` + ellipsis discipline in the grid (decision 3)
- [Accordion later needs programmatic open] → thin wrapper + native `details` refs; no re-architecture (decision 4)

## Migration Plan

Replace the template wholesale: rewrite `src/App.tsx`, rewrite `src/index.css`, delete `src/App.css`, add `src/components/` (Accordion, Sidebar, EditorPane, MetaPanel, Header). Rollback is a git revert — pure presentational code, no data, no schema. `npm run lint` and `npm run build` are the gates.

## Open Questions

- Exact tagline copy for the empty state (copy decision, resolved during apply; does not change specs or approach).