## Why

The version badge landed in the meta panel, but the version is build identity that belongs with the run's other facts, and the status bar already carries them — the open document's path, its save state, and the active vault's name and file count. Placing it there puts the version next to the file count it describes, in the one row that frames every state.

## What Changes

- The meta panel no longer shows the version; its bottom-right corner returns to the keyboard-shortcuts reference alone.
- The status bar shows `v<version>` at its trailing edge, beside the vault's name and file count.
- The badge keeps every property it had: `v<version>` from `package.json`, plain non-interactive text, rendered in every app state, gating nothing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-shell`: the meta-panel version requirement is retired, and the status-bar requirement gains the version at its trailing edge.

## Impact

- `src/components/MetaPanel.tsx`, `MetaPanel.module.css`, `MetaPanel.test.tsx` — revert to the pre-move state (the node code never ships a badge).
- `src/components/StatusBar.tsx`, `StatusBar.module.css`, `StatusBar.test.tsx` — render and test the badge.
- `AGENTS.md` — the build-identity line points at the status bar.
- No new dependency, no index change, no keystroke-path cost.
