## Context

See proposal.md — Why. The workspace and the header are two grids that share the same four column widths through CSS custom properties (`--rail-w`, `--sidebar-w`, `--panel-w`) in `src/index.css`, and the header's slots are placed by column index (`Header.module.css`). The sidebar (`Sidebar.tsx`) and meta panel (`MetaPanel.tsx`) are the two grid items that would collapse; each owns internal `<details>` accordion state that must survive a collapse/expand round trip.

## Goals / Non-Goals

**Goals:** add two full-height collapse strips as real layout columns; drive them from one session-only source of truth; keep the header aligned in every combination; leave the editor, index, and vault untouched.

**Non-Goals:** resizable panes, persisted widths, animation, a keyboard shortcut, any change to the panes' own contents.

## Decisions

**Strips are grid columns, not overlays.** The workspace and header column lists become `rail strip sidebar editor panel strip`, with a new `--strip-w: 16px` token. Two decisions here:

- Rejected: **absolutely-positioned overlay buttons.** They would cover the pane's edge content and need their own hit-testing against the pane's scroll regions; a grid column reserves the strip automatically and needs no z-index or pointer handling.
- Rejected: **one strip only, on the inner edge.** The user chose the outer edge: positionally stable (the strip does not move when its pane toggles) and it keeps a clean left-to-right reading of `rail → control → pane`.

**Collapse is one class on the shell that zeroes a column variable.** `App` holds `leftCollapsed` / `rightCollapsed` and puts a class on `.app-shell`; `index.css` overrides the width variables:

```css
.app-shell { --sidebar-cur: var(--sidebar-w); --panel-cur: var(--panel-w); }
.app-shell.left-collapsed { --sidebar-cur: 0px; }
.app-shell.right-collapsed { --panel-cur: 0px; }
.workspace, .header { grid-template-columns: var(--rail-w) var(--strip-w) var(--sidebar-cur) minmax(0, 1fr) var(--panel-cur) var(--strip-w); }
```

One source of truth drives both grids, so the header can never drift from the workspace.

**Panes stay mounted; a collapsed pane gets `display: none`.** A zero grid track is not enough on its own: a border-box element cannot shrink below its own padding, so the sidebar would keep ~20px of padding. `display: none` removes the box (and its descendants' focusability) while React keeps the component mounted, so the accordion open/closed state inside `Sidebar` and `MetaPanel` survives.

- Rejected: **conditional rendering / unmounting the pane.** Simpler markup, but it resets every accordion section and the keyboard-shortcuts disclosure to defaults on each toggle — an observable regression the specs forbid.
- Rejected: **`visibility: hidden`.** Removes focus but keeps the box, so the padding problem remains.

The pane components take one new primitive prop, `collapsed?: boolean`, and fold a `collapsed` class into their existing root `className`. A boolean prop does not break either component's `memo`.

**The strip is one small presentational component.** `PaneCollapseToggle` renders a full-height `<button>` with an inline chevron (the same 24-viewBox, `aria-hidden` glyph convention as `Sidebar`'s `ChevronIcon` and `StarIcon`). It exposes `aria-expanded`, `aria-controls` pointing at the pane's id, and an `aria-label` that names the pane and the action ("Collapse sidebar" / "Expand sidebar"). Styled from Kami tokens only: no fill, `--stone` arrow, `--dark-warm` on hover, no shadow, no border (the adjacent panes already carry the hairlines, so there is nothing to separate — DESIGN.md rule 6).

## Risks / Trade-offs

- **Header/workspace drift if a future change edits only one grid** → both read the same two variables and the same column list; a test asserts the search input's column in a collapsed state.
- **A collapsed pane's inline width style lingers** → none is used; collapse is class-driven, so there is nothing to reset.
- **`display: none` on a pane mid-measure (Sidebar's windowing)** → the sidebar's scroll handlers already treat a zero-height body as "head of the listing" (`UNMEASURED`); re-expanding re-measures through the existing resize/scroll path, no new code.
- **Keystroke budget.** Toggling is O(1): it flips one boolean and changes one `grid-template-columns`. It reads no vault, document, or index data, and it does not re-render the memoized panes on the typing path. The cost scales with neither vault nor document size, so no measurement is carried.

## Migration Plan

None — no stored state, no on-disk format, no dependencies. Rollback is deleting the strips and their state.
