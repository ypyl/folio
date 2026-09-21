## Why

A board's canvas defaults to Excalidraw's own white (`#ffffff`), so a freshly created board is the one pure-white surface in an app built on warm parchment. `DESIGN.md` bans white and cool-gray surfaces by name; the canvas should feel like the app it lives in. Defaulting it to Kami's `--parchment` (`#f5f4ed`) makes a new board look native from the first stroke, and because it is an Excalidraw background swatch the picker still reads coherently.

## What Changes

- A board with no background of its own opens with the canvas background set to Kami's parchment (`#f5f4ed`) instead of Excalidraw's default white.
- A board that already carries a `viewBackgroundColor` — one saved earlier, or one the user changed with the background picker — keeps it; the default applies only when the scene names none.
- Nothing else about the board changes: the value is part of the scene's `appState`, so it saves and reopens like any other board property.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `whiteboards`: a new requirement that the board editor's default canvas background is the app's parchment, applied only when the board has none.

## Impact

- `src/editor/boardScene.ts` — the scene parser applies the default when `appState.viewBackgroundColor` is absent.
- `DESIGN.md` — records the board canvas's default background and why it is the parchment token rather than Excalidraw's white.
- No new dependency, no index change, no keystroke-path cost.
