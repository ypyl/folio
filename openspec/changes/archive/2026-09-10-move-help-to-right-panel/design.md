## Context

See proposal.md — Why. Relevant current state:

- The right meta panel (`src/components/MetaPanel.tsx`) is an `<aside aria-label="Page links">` holding two `<Accordion>` (`<details>`) sections. The panel is a fixed 220px grid column and its own scroll container (`overflow-y: auto`).
- `Accordion` takes `title` + `defaultOpen` and renders `<details open={defaultOpen}>` with a `<summary>`. Because `defaultOpen` never changes, React never rewrites the `open` attribute after mount, so a user's toggle persists for the session.
- The 220px column is written twice, literally: `src/index.css` (`.workspace`) and `src/components/Header.module.css` (`.header`), which must stay in lockstep for the header to align with the panes.
- The editor's content column is uncapped *by decision* (`static-navigation` spec, the `editor-full-width` change), so the center column has no slack. Panel width comes straight out of prose width.
- The shortcuts reference is a `createPortal` modal: `ShortcutsDialog.tsx`, `.module.css`, `.test.tsx` (133 lines), with `role="dialog"`, `aria-modal`, a scrim, Escape handling, and a focus-into/focus-return contract driven by `SHORTCUTS_DIALOG_ID` (`aria-controls` from the status bar button).
- `SHORTCUT_GROUPS` in `src/components/shortcuts.ts` lists 16 entries. `Heading 1-6` is six chords; `displayKeys` renders each by splitting on `-` and mapping `Mod`.
- One real drift guard exists (`ShortcutsDialog.test.tsx:115-131`): it mounts a real `MilkdownAdapter`, reads `strongKeymap` out of the live context, and asserts the sheet's Bold entry matches. Only Bold is guarded.
- `DESIGN.md` gives the app one chip language. The `kbd` treatment (`--warm-sand` fill, `--border` hairline, 4px radius) is not an outlier — the search input, dropdown, rail entries, and `.btn-secondary` all stack fill + border + radius.

## Goals / Non-Goals

**Goals:**
- Delete the modal and the status bar's `?` button; the reference becomes an ordinary panel section.
- Widen the panel enough that a shortcut row fits on one line, without adding a control or a second scroll region.

**Non-Goals:**
- No change to the shortcut inventory, the `displayKeys` rendering rules, or the key-chip styling.
- No cap on the editor column, no resizable divider.
- No rework of the Backlinks/Forwardlinks sections beyond dropping the "two sections" exclusivity claim.

## Decisions

**D1. The reference is the panel's last section, and its collapsed summary is anchored to the panel's bottom edge.**
The panel is a flex column; the reference accordion carries `margin-top: auto` (so the collapsed row sits at the bottom edge when the page-metadata sections are short) plus `position: sticky; bottom: 0` (so it stays there when they are long enough to scroll), on an opaque panel-colored background so rows scroll beneath it. Opened, the list grows upward from that edge: while it fits the panel it stays anchored there, and when it is taller than the panel it scrolls as ordinary in-flow content. Either way the panel keeps a single scroll container — no second scrolling area, no height cap, nothing clipped.

This replaces this change's original in-flow-only decision, which rested on an estimated open list of ~490px. Measured on the built app, the open list is 668px against an 803px panel viewport, and with a real page open the metadata sections push the collapsed row below the fold — the estimate that justified "no anchoring needed" was wrong by enough to change the decision.

Alternatives considered: a fixed footer (a separately scrolling links region above a pinned, height-capped footer body) — rejected because an open list taller than the panel forces a nested scroll region and an arbitrary height cap, the two things this design avoids; and bare `position: sticky` without `margin-top: auto` — rejected because it only pins once content overflows, so in the short-content state (where most sessions start) the row floats up under the links instead of sitting at the bottom.

**D2. Widen the panel 220px → 280px, in this change, and stop duplicating the column widths.**
280px is the first width where the widest row (`Outdent list item`, 240px) fits with visible slack: panel content is `width - 28px`, so 280 → 252px against a 240px worst case. 220 → 192px, which is why rows had to wrap at all. The cost is ~60px off the editor, which is uncapped by decision, so it is a straight trade of prose width for panel width: at 1280px the editor goes 740 → 680. Justified on its own merits (backlink titles truncate less early), not as a text-fitting workaround. Both grid literals become `:root` custom properties — `--rail-w`, `--sidebar-w`, `--panel-w` — because this change touches both files and they must not drift.

**D3. `Heading 1-6` becomes one range chord, and the drift guard grows to cover it.**
`keys: ['Mod-Alt-1..6']` renders as `Ctrl+Alt+1..6` with no code change, since `displayKeys` splits on `-`. That removes the only row that could not fit (522px of chips). The cost is that this entry stops being six literal bindings, which weakens the original sheet's "honest by construction" property — so the existing guard, which already reads the live keymap for Bold, is extended to assert that heading levels one through six really are bound to `Mod-Alt-N`. That is a stronger guarantee than six hardcoded chips, because it is the check that catches a preset upgrade. Alternative considered: leave six chips and let the row wrap to three lines — rejected, it is the one visibly broken row and the data fix is free.

**D4. The list becomes a plain component; the dialog is deleted rather than stripped.**
New `src/components/ShortcutsList.tsx` + `ShortcutsList.module.css`, rendered inside the panel's new `Accordion`. `MetaPanel` stays a composition and does not grow a second reason to change; keeping the file named `ShortcutsDialog` would name a component after a surface it no longer renders. `SHORTCUTS_DIALOG_ID` is deleted — its only consumers were the button's `aria-controls` and the dialog's `id`, both of which go away. Tests split by concern, matching the repo's `parse.ts` / `parse.test.ts` habit: `shortcuts.test.ts` for `displayKeys` and the drift guard (data), `ShortcutsList.test.tsx` for rendering (groups, labels, chips, and *not* being exposed as a dialog).

**D5. Group labels stop being headings.**
The dialog used `<h2>` + `<h3>`. The app's chrome currently contains no headings at all — accordion titles are `<summary>`, the status bar and sidebar have none; the only headings in the app are inside the editor document. Keeping `<h3>` would introduce the chrome's first heading, out of level, under a `<summary>` that is not a heading. `<p>` inside a `<section aria-labelledby>` carries the same assistive-technology label without touching the outline, and renders identically (11px uppercase, letterspaced).

**D6. Collapsed by default.**
Open, the list is 668px (measured) against an 803px panel viewport at a 900px-tall window — 83% of the panel — and it pushes the page-metadata sections to a sliver. Collapsed, the bottom-anchored row costs 34px. Open-by-default would evict the panel's stated job on every load. A first-run reveal (open while no page is open) was rejected: `defaultOpen` is read only at mount and the panel never remounts, so it would need controlled state for a nicety.

**D7. No ADR.**
A single removed modal is a UI choice, not an architecture decision. ADR-0005 (keep the UI small, three-pane layout) and ADR-0006 (scope guardrails) already point this way, and the rejected alternative is recorded here — matching how the archived `keyboard-shortcuts-help` design.md recorded its own rejection of a floating panel.

**D8. The panel's accessible name becomes "Page sidebar".**
`aria-label="Page links"` on an `<aside>` that now contains a keyboard reference is inaccurate. The capability name `ui-shell` is unchanged — no spec rename churn.

## Risks / Trade-offs

- [The open list is taller than the panel and squeezes the page-metadata sections] → The panel scrolls as one region and the collapsed row is bottom-anchored, so the resting cost is a 34px row; opening it is a deliberate act and the list scrolls with the panel.
- [The bottom-anchored row is transparent and long link lists scroll visibly behind it] → The row carries the panel's own surface color, so content passes beneath it cleanly. Kami forbids shadows on non-floating surfaces, so the fill is the whole separation.
- [A preset upgrade rebinds heading levels and the range chord goes stale] → Extend the existing live-keymap drift guard to assert levels 1-6 (D3). This is the guard the sheet lacked.
- [Panel width comes out of prose width, and the editor is uncapped by decision] → 280px is the first width with slack; the trade is recorded here so a later reader can revisit it deliberately rather than by accident.
- [The two column literals drift apart again] → Shared custom properties (D2). A header that stops aligning with the panes is the visible symptom.
- [Deleting the dialog removes the app's only demonstration of dialog semantics and a focus contract] → Those tests tested the modal, not the reference. A `<details>` disclosure is native, so there is no contract to replace. The scenarios that survive are re-expressed in the new `ui-shell` requirement.
- [The panel gains a non-metadata section, so "meta panel" reads wrong] → Only the accessible name changes (D8); the component and capability names stay, avoiding a rename that would churn the spec for no behavior gain.

## Migration Plan

No persisted state and no data migration — nothing on disk, in IndexedDB, or in the index is affected. The reference has no route to redirect (there was no keybinding, only the button), so there is nothing to deprecate first. Roll back by reverting the change; no artifact outlives it.

## Open Questions

None.
