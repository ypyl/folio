## Why

The Keyboard shortcuts panel tells users how to create a code block (`Ctrl/Cmd+Alt+C`) but not how to leave or remove one. A user who creates a block by accident has to guess: the real behaviors — `Mod+Enter` exits the block, and `Backspace` at the very start of a one-line block turns it back into a paragraph — are currently undiscoverable in the app. Surface them next to the shortcut that creates the block.

## What Changes

- The Keyboard shortcuts reference gains two rows:
  - **Exit code block** → `Mod-Enter` (`Ctrl/Cmd+Enter`)
  - **Code block to paragraph (at start)** → `Backspace`
- `Mod-Enter` now appears twice in the sheet — once as **Open reference** (`add-reference-badges`), once as **Exit code block**. This is intentional and accurate: the chord is context-dependent (inside a reference vs. inside a code block), and the two can never apply at the same time.
- Extend the shortcuts drift guard (`src/components/shortcuts.test.ts`) to cover the new rows.

## Capabilities

### New Capabilities
<!-- None. This extends an existing panel's content. -->

### Modified Capabilities
- `ui-shell`: the keyboard-shortcuts reference requirement is extended — the sheet must also cover leaving a code block and turning one back into a paragraph, in addition to creating one.

## Impact

- `src/components/shortcuts.ts` — two new `SHORTCUT_GROUPS` rows in the Editing group.
- `src/components/shortcuts.test.ts` — drift-guard coverage for the new rows.
- `openspec/specs/ui-shell/spec.md` — the requirement delta.
- No code-block or editor behavior changes: the panel documents bindings that already exist (Milkdown's code-block component binds `Mod-Enter` to `exitCode` and converts on `Backspace` at offset 0 of a one-line block).
- ADRs: no architectural decision changes, so **no new ADR**. The panel is governed by `ui-shell` and (for the open-reference row) `add-reference-badges`.

## Non-goals

- **No new key bindings.** `Mod-Enter` stays `exitCode`, `Backspace` stays the component's convert, `Ctrl/Cmd+Alt+C` stays create-only. This change only documents what already exists.
- **No toggle for `Ctrl/Cmd+Alt+C`.** Making the create shortcut also remove a block is a behavior change to the code-block surface, deliberately not done here.
- **No free-text or note rows in the panel.** The panel renders only `label + key tokens`; the context qualifier lives in the label, and no new row kind is introduced.
- **No redesign of the shortcuts section** (layout, grouping, disclosure behavior) and no change to the editor's other shortcuts.
