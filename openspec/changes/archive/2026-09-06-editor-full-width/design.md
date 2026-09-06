## Context

`EditorPane.module.css` `.document` has `max-width: 720px; padding: 40px 48px 64px;` — an editorial-measure cap that predates the full layout. The workspace grid gives the pane column `minmax(0, 1fr)` (index.css), so the column is always as wide as available; only the wrapper caps the content (see proposal.md — Why). DESIGN.md defines no content-width token, so nothing else changes.

## Goals / Non-Goals

**Goals:**
- Editor surface spans the full pane width, bounded by the pane's edge padding.
- Zero behavioral or test surface change beyond the CSS.

**Non-Goals:**
- No layout rework of the workspace grid or the pane padding.
- No responsive breakpoints (folio is Chromium-first desktop; the pane already adapts by being `minmax(0, 1fr)`).

## Decisions

**D1 — Delete the `max-width` cap, keep the padding.** One property removed from `.document`; the block-level editor then fills the wrapper, which fills the pane. Alternatives rejected: raising the cap to a larger measure (still leaves dead space on wide windows — the user asked for all available space); adding `width: 100%` (unnecessary — block layout already fills).

## Risks / Trade-offs

- [Very long lines on ultra-wide windows become hard to scan] → Folio targets typical desktop widths; the 48px edge padding keeps content off the window edge. A future reading-width toggle would be its own change (scope guardrail, ADR-0006).