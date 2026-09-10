# move-help-to-right-panel

## Why

The keyboard-shortcuts reference is the app's only modal. It is opened from a `?` button in the status bar's far-right corner, covers the workspace, and must be dismissed — so the most reference-like content in the app is the one thing you have to open and close, and a corner button is the status bar's only action. The shell already has a panel that is present in every app state, scrolls independently, and holds exactly this kind of inspection content: the right meta panel. Moving the reference there deletes the modal, the corner button, and the whole focus/Escape/scrim contract they needed.

The panel is too narrow for its current job, and the reference makes that worse. At 220px its content column is 192px, so backlink titles truncate and a two-column shortcut row has nowhere to land.

## What Changes

- The shortcuts reference becomes the right meta panel's last collapsible section, closed by default. Its content (the shortcut groups and the platform-aware key chips) is unchanged.
- The status bar loses its `?` button and becomes display-only, apart from the pin star. The header and status bar requirements stop mentioning a help button.
- The modal goes away entirely: `ShortcutsDialog` and its portal, scrim, `role="dialog"`, `aria-modal`, focus-into/focus-return contract, and Escape handling are deleted, along with the `SHORTCUTS_DIALOG_ID` aria wiring.
- The right panel widens from 220px to 280px, in the same change. The first width where a shortcut row fits on one line with slack; it also stops backlink titles truncating as early. Both grid literals (`.workspace` and `.header`) move to shared custom properties so they cannot drift.
- `Heading 1-6` collapses from six key chips to one range chord (`Ctrl+Alt+1..6`). The existing drift guard test — which mounts a real Milkdown adapter and compares the live keymap to the sheet — is extended to assert levels 1-6, so the range stays honest.
- The panel's group labels stop being headings. The app's chrome currently has none, and the accordion summaries are not headings either; `<p>` plus `aria-labelledby` carries the same assistive-technology information without an orphaned `h3`.
- The panel's `aria-label` changes from `"Page links"` to `"Page sidebar"`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-shell`: three requirements change and one is replaced. **REMOVED** — "A question-mark button opens a keyboard-shortcuts reference" (the button and modal no longer exist). **ADDED** — the right panel's last section is the shortcuts reference, closed by default, reachable in every app state. **MODIFIED** — "Meta panel is an accordion of page metadata" (no longer claims the panel contains exactly two sections), "The shell shows an app-level status bar" (no help button; the "no actions beyond the help button" clause is retrued so the pin star is no longer unaccounted for), and "Header shows brand, content-width search, and an active-vault status slot" (drops the help button from the moved-to-the-status-bar list).

## Impact

- **New**: `src/components/ShortcutsList.tsx` + `ShortcutsList.module.css` (the list on its own, no shell chrome).
- **Deleted**: `src/components/ShortcutsDialog.tsx`, `ShortcutsDialog.module.css`, `ShortcutsDialog.test.tsx`.
- **Changed**: `src/components/MetaPanel.tsx` (third section, `aria-label`), `src/components/StatusBar.tsx` + `.module.css` (drop the button and its props), `src/App.tsx` (drop `helpOpen`, `onHelp`, the dialog render), `src/components/shortcuts.ts` (drop `SHORTCUTS_DIALOG_ID`, range chord), `src/index.css` + `src/components/Header.module.css` (column widths to custom properties).
- **Tests**: new `src/components/shortcuts.test.ts` (display keys + extended drift guard) and `ShortcutsList.test.tsx`; `StatusBar.test.tsx`, `MetaPanel.test.tsx`, `App.test.tsx` updated.
- **Relations to prior decisions**: no new ADR. ADR-0005 (keep the UI small, three-pane layout) and ADR-0006 (scope guardrails) point this way — a section in an existing pane instead of a second surface. This change reverses part of `add-status-bar` (which moved help into the bar) and the whole of `keyboard-shortcuts-help`'s "one stable, non-scrolling surface" rationale; the rejected alternative is recorded in `design.md`, matching how the archived `keyboard-shortcuts-help` design.md recorded its own rejection.
- **Not affected**: no editor, vault, index, or storage change. No new dependency. Markdown stays canonical; nothing here touches the on-disk contract.

## Non-goals

- No formatting toolbar, floating menu, or command palette. The reference stays a list; the affordance stays a disclosure row.
- No new keybinding to open the reference. There was none before (`?` types a character in the editor) and none after.
- No editable keymap or preferences system.
- No resizable or draggable pane dividers. The width becomes a fixed 280px, not a user-controlled one.
- No cap on the editor's content column. `static-navigation` deliberately leaves the editor uncapped; this change does not revisit that.
- No chip/restyle of the shortcut list. The `kbd` treatment moves files unchanged.
- No reordering or collapsing behavior imposed across panel sections. Backlinks and Forwardlinks keep opening independently of the reference.
