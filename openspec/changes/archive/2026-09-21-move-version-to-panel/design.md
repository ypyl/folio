## Context

The version badge lives in `Header.tsx` as a `<span>` beside the brand button, positioned by a `.version` rule whose whole reason for existing is keeping the 12px badge's baseline level with the 16px wordmark on a shared line. The right meta panel (`MetaPanel.tsx`) is a flex column: three link bands that share the leftover height, then a keyboard-shortcuts `<details>` that is bottom-anchored (`margin-top: auto`) and sticky to the panel's bottom edge.

## Goals / Non-Goals

**Goals:** the badge reads at the panel's bottom-right corner, in every app state; no other layout moves.

**Non-Goals:** changing the badge's content, its non-interactive nature, or the keyboard-shortcuts section.

## Decisions

**Put the badge in the meta panel's bottom-anchored group, right-aligned, after the shortcuts reference.** The panel's bottom strip is already the one region that is fixed to the panel's bottom edge; appending a right-aligned line to that group lands the badge in the bottom-right corner by the same layout that already anchors the shortcuts row. `align-self: flex-end` does the right-alignment.

**Move the anchoring from the shortcuts `<details>` to a wrapper that holds the details and the badge.** The shortcuts section's stickiness must cover the badge too, or the badge scrolls under it when an open shortcuts reference makes the panel scroll. The wrapper takes `margin-top: auto`, `position: sticky`, `bottom: 0`, and the panel's own ivory fill; the details loses them and keeps everything else.

Rejected: **a separate version row below the sticky details.** The sticky details renders over flow content beneath it, so the badge would disappear under the shortcuts row exactly when the panel scrolls.

Rejected: **the status bar.** It is the app's status frame (path, save state, vault name and count); the version is build identity, and the meta panel is the panel the request named.

**The header requirement is removed and re-added under a clearer name rather than modified.** OpenSpec's `MODIFIED` refuses to drop a scenario — the version scenario must go from the header, because the header no longer shows the version — so the delta retires the whole requirement and adds its surviving text under the new name, the pattern the repo already used in `journal-home` and `add-history-navigation`. The trade-off is that the header requirement moves to the end of the main spec's requirement list; ordering there is not semantic.

## Risks / Trade-offs

- **The badge now lives in a panel that is absent from no state** — the meta panel renders unconditionally in `App`, so the "renders in every app state" guarantee is kept, and `MetaPanel`'s existing tests already render it in each state.
