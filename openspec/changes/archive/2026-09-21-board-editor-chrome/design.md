## Context

`boardView.module.css` already gives the board host a `.board` box, and `BoardView` renders Excalidraw as a child. Excalidraw themes itself entirely through CSS custom properties defined on `.excalidraw` (one class), with a `.excalidraw.theme--dark` variant (two classes) we never activate. Its chrome defaults are white islands, the violet-blue `--color-primary` (`#6965db`), cool grays, cool shadows, and the bundled `Assistant` interface font.

## Goals / Non-Goals

**Goals:** the editor's chrome reads in the app's palette, scoped, with no layout change.

**Non-Goals:** re-theming the canvas rendering, the tool icons, the toolbar layout, or the hand-drawn drawing fonts; shipping an Excalidraw dark theme.

## Decisions

**Override the library's variables under a scoped selector.** `src/editor/boardView.module.css` gains `.board :global(.excalidraw) { … }`, mapping the accent, surface, text, border, shadow, and font variables to Kami tokens. Two classes beat the library's one-class base, so the override wins without `!important`, and the `.board` scope keeps it out of every other surface. Overriding variables (rather than the library's DOM) is the supported theming seam and survives its internal markup.

**Map to Kami tokens; derive the shades the palette lacks.** `--color-primary` is `--brand` (`#1b365d`); its darker hover/active variants use `color-mix(in srgb, var(--brand) …%, black)`, and its light container uses `--brand-tint`, so the accent stays on-palette without inventing new hex values. Surfaces map to `--ivory`/`--parchment`/`--warm-sand` (never white), text to `--near-black`/`--olive`, borders to `--border`/`--stone`, and the shadow to the app's whisper shadow.

**Leave functional and structural variables alone.** Danger/warning/success colours, tool icon sizing, button sizes, the canvas rendering, and the drawing fonts are not palette and are deliberately untouched, so the editor behaves and lays out exactly as before.

Rejected: **patching the library's CSS or DOM.** Version-fragile in a worse way, and it would not survive a package update at all.

Rejected: **a full re-skin (toolbar layout, custom icons).** Out of scope and much more failure-prone; the palette gets the "looks native" result without it.

## Risks / Trade-offs

- **The variable names are the library's, not a stable public API** → the override is a pinned set of variables covered by a browser check; a package upgrade that renames them degrades to the stock theme rather than breaking, and the check catches it.
- **`color-mix` for the derived shades** → Chromium-first app (ADR-0002); `color-mix` is supported.
- **Contrast on warm surfaces** → verified in the browser check against the editor's own text colours, not just by eye.
