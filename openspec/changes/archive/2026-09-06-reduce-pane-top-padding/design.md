## Context

`EditorPane.module.css` `.document` is `padding: 40px 48px 64px;` — heavy top from the removed title-heading era (see proposal.md — Why). The pane's empty state and header are unaffected; only open pages use `.document`.

## Goals / Non-Goals

**Goals:**
- Top padding halved to 20px; sides (48px) and bottom (64px) untouched.
- Zero behavioral or test surface change.

**Non-Goals:**
- No change to the empty state, pane rail, or app chrome.

## Decisions

**D1 — One value change in `.document`.** `padding: 40px 48px 64px` → `padding: 20px 48px 64px`. Alternatives rejected: removing top padding entirely (content would touch the pane's edge; the panel needs a little air), increasing rail/header compensation (out of scope). 20px matches the rail/header rhythm (ui-shell 56px columns, 12px header padding) for visual alignment.

## Risks / Trade-offs

- [Content closer to the top may crowd the SaveIndicator space on short panes] → The indicator is sticky at the pane bottom (design C3); top padding is independent of it. No realistic risk.