## Context

A board's scene is `{ elements, appState, files }`; Excalidraw's own default `appState.viewBackgroundColor` is white (`#ffffff`). `boardScene.ts` parses a board file into that shape and fills absent fields. `DESIGN.md` bans pure white and cool-gray surfaces, and names `--parchment` (`#f5f4ed`) as the page background.

## Goals / Non-Goals

**Goals:** a board with no background of its own opens on the app's parchment; a board that names one keeps it.

**Non-Goals:** changing Excalidraw's palette, its other appState defaults, or any app chrome.

## Decisions

**Apply the default in `parseScene`, not in `initialData` at the call site.** The parser already decides what an absent field means (it fills `elements`, `appState`, and `files`), and it is the one place that sees the board's own value first. The rule is a nullish fallback: `viewBackgroundColor: appState.viewBackgroundColor ?? DEFAULT_BOARD_BACKGROUND`. A board saved with a background, or one whose background the user changed with the picker, carries the value in its scene, so the fallback never fires for it. `DEFAULT_BOARD_BACKGROUND` is the parchment token's value (`#f5f4ed`), named once with a comment pointing at `DESIGN.md`.

Rejected: **setting `initialData.appState.viewBackgroundColor` in `BoardView`.** It would apply to every board, including ones that carry their own background, silently overwriting the user's choice.

Rejected: **reading the CSS custom property at runtime.** The value travels to Excalidraw as a JS string, not a CSS surface; a `getComputedStyle` read on mount would add a layout dependency and a failure mode for a constant that `DESIGN.md` already fixes.

## Risks / Trade-offs

- **A custom background reads as unselected in Excalidraw's picker** (parchment is not one of its five swatches) → accepted: the app's design language wins over a picker's default selection, and the chosen value still shows as the current colour.
