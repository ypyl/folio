# Add file breadcrumb — Design

## Context

See proposal.md — Why. The editor pane (`src/components/EditorPane.tsx`) is a single scroll container (`<main class="pane">`, `overflow-y: auto`) holding `.document` (with the absolute line-number gutter inside) and the SaveIndicator. The pane is keyed by page path in App, so it remounts per page; scroll reset (`paneRef.scrollTop = 0`) is keyed on `page?.path`. `Page.path` already carries the vault-relative identity (ADR-0013) — no data plumbing needed. Kami metadata is stone 12px text, no decoration (the line gutter is the precedent).

## Goals / Non-Goals

**Goals**

- Show the open page's real file path above the document, persistently visible while scrolling.
- Keep the change additive: one component + CSS, no new state, no new props, no scroll-architecture changes.

**Non-Goals**

- No clickable segments, no folder navigation, no copy-to-clipboard (proposal Non-goals).
- No existence/save-state awareness — the content fallbacks (`pendingBlank`/`lastKnown`) and SaveIndicator own those stories.

## Decisions

**D1. Segmented, non-interactive breadcrumb.** Split `page.path` on `/`, render segments joined by separators, `.md` kept on the last segment. Alternatives: a flat path string (reads less like a breadcrumb, and the segmented form reserves the vocabulary for future tool navigation); stem-only (a second pretty label — contradicts the point). Non-interactive by construction: plain text, no button/link semantics, no hover affordance, so nobody reads segments as navigation that doesn't exist.

**D2. Sticky inside the existing pane scroller.** The crumb is the first child of `.pane` in the page-open branch with `position: sticky; top: 0; z-index: 1`. Alternatives: flex-column with a fixed crumb row and the document in its own scroller — correct visual separation but moves the scroll container: the scroll-reset effect, drop handlers, SaveIndicator anchoring, and the gutter's absolute math all shift (violates the keep-it-small rule, ADR-0006); an in-flow row that scrolls away — useless once scrolled (the whole job is "where am I now") and fights the gutter's `top: 16px` alignment. Sticky costs the standard overlap: content passes under the bar, so it needs an opaque parchment background and a hairline `--border` bottom edge (Kami rule 4: flat, no shadow).

**D3. Truncate from the left, protect the file name.** The breadcrumb row is `white-space: nowrap` with `overflow: hidden`; the last segment is `flex-shrink: 0` so the file name never truncates while earlier segments do (classic crumb rule — the current location survives). If a single segment alone overflows, it ellipsizes. Full path always in the `title` tooltip.

**D4. Dumb, derived, remount-safe.** The crumb renders `page.path` at render time — no state, no effects, no existence checks. It renders only in the page-open branch (empty, loading, and results views stay crumb-less) and automatically handles new pages (path shown is the would-be file, matching the materialize-on-first-save model) and vanished pages (stale path; the indicator owns failure). Because the pane already remounts per page, there is no lifecycle interaction.

**D5. Accessibility.** Unlike the line-number gutter (`aria-hidden` — it duplicates block info), the crumb is the pane's only file identity, so it stays in the a11y tree as static text; no role needed. The `title` tooltip carries the full path.

## Risks / Trade-offs

- [Content ghosting under the sticky bar while scrolling] → opaque parchment background, hairline border, `z-index` above the document.
- [Gutter/crumb overlap] → the gutter is absolutely positioned inside `.document`; the crumb is a sibling in flow, so at rest they never collide, and when scrolled the opaque crumb covers the gutter cleanly.
- [The crumb and the journal-calendar label deliberately disagree (`journals/2026-09-08.md` vs "September 8, 2026")] → intended; the crumb is the truth layer, not a label. Spec covers it.
- [Truncation hides directories on long paths] → tooltip always has the full path; this is standard crumb behavior.

No migration needed (additive UI change); rollback is reverting the component and its CSS.