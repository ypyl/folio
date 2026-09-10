## Context

See proposal.md — Why. Constraints that shape the approach:

- The reference is a flat list of `label + key tokens` (`SHORTCUT_GROUPS` in `src/components/shortcuts.ts`, rendered by `ShortcutsList`); it has no note or free-text row kind.
- `Mod-Enter` is already listed as **Open reference** by the un-archived `add-reference-badges` change, and is also the code-block component's `exitCode` chord.
- The code-block behaviors live in Milkdown's code-block component (a CodeMirror surface), not in the ProseMirror keymap `ctx` the existing drift guard reads (`strongKeymap`, `headingKeymap`). So the guard cannot read these bindings the way it reads the formatting ones.
- The `ui-shell` requirement "The right panel's last section is a keyboard-shortcuts reference" enumerates the sheet's contents in one large block.

## Goals / Non-Goals

**Goals:**
- Make the code-block exit and convert behaviors discoverable in the panel.
- Keep the sheet truthful: only real bindings, with the context in the label.

**Non-Goals:**
- Changing any editor binding or the code-block surface.
- Adding a new row kind (notes, categories) to the panel.
- Making `Ctrl/Cmd+Alt+C` a toggle.

## Decisions

**D1 — ADD to `ui-shell`; do not rewrite the enumeration requirement.** The new listing is a new concern, so the delta adds a focused requirement ("The keyboard-shortcuts reference covers leaving a code block") rather than replacing the large enumeration block. Alternative: MODIFY the enumeration to insert "code block exit and removal" into its list. Rejected: it forces copying the whole requirement-plus-scenarios block and would make this change overlap the un-archived `add-reference-badges` row edit, for no behavioral gain.

**D2 — Two rows, context in the label.** `Exit code block` → `Mod-Enter`; `Code block to paragraph (at start)` → `Backspace`. The panel has no note row, so the condition lives in the label. Alternative: a generic "Code block" row with both chords. Rejected: it hides which chord does what and reads as two ways to create a block.

**D3 — Duplicate `Mod-Enter` is intentional.** The chord is listed once as "Open reference" and once as "Exit code block". The two apply in mutually exclusive contexts (caret in a reference vs. caret in a code block), and the sheet is a per-action reference, not a keyboard map. Hiding one would make a real, useful chord undiscoverable.

**D4 — The drift guard stays honest about what it can read.** The guard asserts the two rows exist with the specified chords and labels. It does not claim to read the code-block component's keymap (it cannot, from `ctx`); the live behaviors were confirmed in a browser and are re-checked by the tasks. The guard's comment is scoped so it does not overstate coverage.

## Risks / Trade-offs

- **Label-based context is weak** (the Backspace row only makes sense with "(at start)") → mitigation: the requirement and the label state the condition; the row is a pointer to a behavior, not a full description.
- **Two rows with one chord could read as a conflict** → mitigation: D3's labels name the action ("Exit code block") so the reader sees the context; the acceptance tasks check both rows render.
- **Behavior verified against a component, not our own keymap** → mitigation: the browser check in `add-reference-badges` already established `Mod-Enter` exits and `Backspace` at start converts; the tasks re-confirm both before marking done.

## Migration Plan

Not applicable — content-only change to an existing panel. Rollback is a git revert.
