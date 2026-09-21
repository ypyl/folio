## Why

A board opens onto a parchment canvas, but the editor's own chrome — toolbar, islands, menus, dialogs, buttons, its blue accent and interface font — is Excalidraw's stock light theme: white islands, a violet-blue accent, cool gray borders, cool shadows. The canvas now looks native and the chrome around it does not, so a board reads as a foreign app pasted into the pane.

## What Changes

- The board editor's chrome takes the app's palette: the ink-blue brand accent, warm parchment/ivory surfaces instead of white and cool gray, warm borders, the app's interface font, and the whisper shadow — scoped to the board editor only.
- Limited to **colours, surfaces, borders, text, shadows, and the interface font**. The editor's layout, toolbar arrangement, tool icons, canvas rendering, and the hand-drawn drawing fonts are untouched.
- The canvas fill keeps its parchment default (board-default-background); this change is the chrome around it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `whiteboards`: a new requirement that the board editor's chrome renders in the app's palette (accent, surfaces, borders, text, shadows, interface font) rather than the editor library's stock light theme.

## Impact

- `src/editor/boardView.module.css` — a scoped override of the editor's theming variables under the board host.
- `DESIGN.md` — records the board editor chrome rule.
- No new dependency, no index change, no keystroke-path cost (CSS only). The override is version-fragile against the editor package and is covered by a browser check rather than unit tests.
