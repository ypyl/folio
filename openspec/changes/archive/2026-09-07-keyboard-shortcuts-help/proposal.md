# keyboard-shortcuts-help

## Why

Folio is a keyboard-first editor, but its formatting shortcuts are invisible: there is no toolbar, and nothing in the app documents that `Ctrl+B` toggles bold, `Ctrl+I` italic, `Ctrl+E` inline code, and so on. A user who types `**x**` and regrets it has no way to discover how to un-format it (select + `Ctrl+B`). The Markdown input rules work, but the WYSIWYG view hides the markers, leaving users stuck.

## What Changes

- A circular `?` button in the header's right slot, next to the vault status, opens a shortcuts reference dialog. The header slot is currently specced as display-only ("SHALL NOT perform actions"); this change amends that requirement.
- The dialog lists the editor's real, currently-bound shortcuts (bold, italic, inline code, undo/redo, headings, paragraph, lists, blockquote, code block, indent/outdent, line break) and the app's search shortcut. Only shortcuts that actually exist are listed — links and strikethrough have no keymap and are not listed.
- The dialog is modal: `Esc` closes, focus moves into the dialog on open and returns to the button on close, styled with Kami tokens.
- No new keybinding to open the sheet (a `?` key would type a literal `?` in the editor); the button is the affordance.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-shell`: the header slot changes from display-only to hosting a help button that opens the shortcuts dialog; the dialog surface itself is part of the shell.

## Impact

- New component under `src/components/` (e.g. `ShortcutsDialog`) + its module CSS, using Kami tokens from `DESIGN.md` (D3).
- `src/components/Header.tsx` — a `help` affordance slot next to the vault status; `App.tsx` composes the button and dialog state.
- `src/components/Header.test.tsx`, an `App.test.tsx` addition or a focused dialog test — open/close, Esc, focus behavior.
- No editor layer changes; this is app-shell UI. No new ADR needed (ADR-0006 keep-it-small is respected: a single reference surface instead of a toolbar or formatting menu).

## Non-goals

- No formatting toolbar or floating formatting menu in the editor pane.
- No clear-formatting command in this change.
- No new editable keybindings/preferences system.
- No README rework — the in-app sheet is the reference.