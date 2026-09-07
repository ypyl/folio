# keyboard-shortcuts-help — Design

## Context

See proposal.md — Why. The header (`src/components/Header.tsx`) has three columns — brand, search, slot — and the slot renders only the display-only vault status; the ui-shell spec presently forbids actions there (amended by this change's delta). The app has no modal precedent; the closest overlays are the search dropdown (SearchResultsView) and the accordions. Styling rules: Kami tokens from DESIGN.md (warm parchment surfaces, `--brand` ink only accent, 4px spacing base, 8px radius, flat surfaces). The shortcut inventory is fixed by the editor preset: Milkdown `commonmark` keymaps (bold `Mod-b`, italic `Mod-i`, inline code `Mod-e`, headings `Mod-Alt-1..6`, paragraph `Mod-Alt-0`, ordered list `Mod-Alt-7`, bullet list `Mod-Alt-8`, blockquote `Mod-Shift-b`, code block `Mod-Alt-c`, list indent/outdent `Tab`/`Shift-Tab` and `Mod-[`/`Mod-]`, hard break `Shift-Enter`), `plugin-history` (undo `Mod-z`, redo `Mod-y`/`Shift-Mod-z`), plus the app's search `Mod-k`. Links and strikethrough have no keymap and are not listed.

## Goals / Non-Goals

**Goals:**
- One discoverable surface that names every real editor shortcut plus search.
- Dependency-free, Kami-styled, keyboard-clean (Esc closes, focus moves in/returns out).

**Non-Goals:**
- No keybinding to open the sheet (`?` in the editor types a character; the button is the affordance).
- No editable/preferences keymap system, no toolbar or formatting menu.
- No change to editor bindings themselves.

## Decisions

**1. Button lives in the header slot beside the vault status — always visible, not only with a vault.**
The header is the one stable, non-scrolling surface in the app. Alternative considered: floating in the editor pane — rejected: the pane scrolls and is a content surface. The slot's "no actions" rule is amended in the ui-shell delta.

**2. The dialog is a small dedicated component (`ShortcutsDialog`) rendered via a portal to `document.body`.**
A portal escapes the header's stacking context so a full-bleed overlay cannot be clipped, and it mirrors nothing else in the app — the search dropdown works because it is a sibling overlay; a centered modal needs body-level positioning. No new dependency (no headless-ui); plain `role="dialog"` + `aria-modal` + keyboard handling, the app's current style is dependency-free.

**3. Focus contract: move into the dialog on open, Esc closes, focus returns to the button.**
Kept deliberately small (no full focus trap — the dialog has no focusable list, so moving focus to the dialog surface and returning it is enough). Esc is handled on the overlay; a close button (the `×` control) is provided for pointer users.

**4. The shortcut list is a single curated constant in the component, with keys rendered platform-aware.**
`Mod` is shown as `Ctrl` on Windows/Linux and `Cmd` on macOS via a tiny platform check (Chromium-first; Edge/Chrome on Windows is the primary target). The list is hard-coded to match the preset bindings exactly — honest by construction; alternative (reading the bound keymaps at runtime) adds machinery for a reference that changes only when the preset changes.

**5. Styling follows DESIGN.md**: parchment surface, `--border` hairline, `--near-black` labels with `--stone` keys, `--brand` only for the button's hover/focus (focus treatment per the shell's visible-focus requirement), 8px radius, flat — no shadows.

## Risks / Trade-offs

- [Preset upgrades rebind shortcuts while the sheet's constant is stale] → The constant is annotated with its preset source; a test pins the listed Bold entry to the editor's actual `Mod-b` toggle behavior so drift surfaces in CI.
- [Portal + overlay in jsdom tests needs care] → `createPortal` renders to `document.body`; testing-library queries by `role="dialog"` and Esc dispatch keep it testable.
- [Adding the first modal in the app] → Kept minimal and dependency-free; the overlay follows the existing flat Kami surface language so it reads as native.
- [Focus move-on-open can steal typing context] → The button is the only entry point and the dialog is modal; restoring focus to the button on close preserves keyboard position.

## Open Questions

None.