## Why

When a drawing tool is active — rectangle, ellipse, diamond, line, arrow, freedraw, text, frame — the editor shows the operating system's crosshair cursor over the canvas. The colour of that cursor belongs to the platform, not the app, so it is the one piece of the board that ignores the palette and can read as a foreign colour (it renders blue on the reporter's machine). Every other cursor the editor shows is its own (the hand's grab, the eraser's circle, the laser's custom SVG); the drawing tools are the only ones left to the platform.

## What Changes

- For the tools that show a crosshair, the board editor uses an app-drawn cursor: an ink-blue crosshair with a light halo, so it reads on both light and dark drawings and follows the palette.
- The cursor is drawn only for the tools that would show a crosshair; the selection, hand, eraser, laser, image, and custom tools keep exactly the cursor they had.
- This is the cursor only: tool behaviour, drawing, hit-testing, and every other cursor are unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `whiteboards`: a new requirement that the crosshair cursor over the board canvas is drawn in the app's palette rather than the platform's colour.

## Impact

- `src/editor/boardView.tsx` — tracks whether the active tool is a crosshair tool and exposes it on the board host.
- `src/editor/boardView.module.css` — the cursor override, scoped to the host and to the crosshair tools.
- `DESIGN.md` — records the board cursor rule.
- No new dependency, no index change, no keystroke-path cost (one attribute write when the active tool changes).
