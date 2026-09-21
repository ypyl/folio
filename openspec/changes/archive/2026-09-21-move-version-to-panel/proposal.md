## Why

The running version sits beside the Folio wordmark in the header, on the title's own line and in the header's most prominent cell. It is build identity, not an action and not status: it should be findable but out of the way. The header's job is the brand and the search box, and the badge dilutes the brand line for no gain.

## What Changes

- The header no longer shows the version; the brand line is the wordmark alone.
- The right meta panel shows the version at its bottom-right corner, below the keyboard-shortcuts reference — a quiet stamp in the panel's last corner.
- The badge keeps every property it had: `v<version>` from `package.json`, plain non-interactive text, rendered in every app state, gating nothing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-shell`: the header requirement drops the version; a new requirement places it at the meta panel's bottom-right corner.

## Impact

- `src/components/Header.tsx`, `Header.module.css` — remove the badge and its baseline rule.
- `src/components/MetaPanel.tsx`, `MetaPanel.module.css` — render the badge at the panel's bottom edge, right-aligned, with the keyboard-shortcuts footer.
- `src/components/Header.test.tsx`, `MetaPanel.test.tsx` — move the badge's tests to the panel.
- `AGENTS.md` — the build-identity line still calls it "the header badge"; it moves to the panel.
- No new dependency, no index change, no keystroke-path cost.
