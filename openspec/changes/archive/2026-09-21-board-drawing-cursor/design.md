## Context

Excalidraw sets the pointer cursor on its interactive canvas imperatively: `canvas.style.cursor = 'crosshair'` for the drawing tools (everything except selection, hand, eraser, laser, image, and custom). That is the operating system's crosshair, and its colour is the platform's, so the app cannot recolour it. The library already draws its own cursors for the tools it treats specially — the eraser's circle (a canvas-generated PNG) and the laser's SVG — so the crosshair is the one cursor left to the platform.

`BoardView` already receives `appState` on every `onChange`, and the board host is a `div` it owns.

## Goals / Non-Goals

**Goals:** the crosshair over the canvas follows the palette; every other cursor is untouched.

**Non-Goals:** restyling the other cursors (they are already the editor's own), changing tool behaviour, or drawing tool-specific cursors.

## Decisions

**Expose the active tool's crosshair-ness on the host, then override the cursor in the stylesheet.** `BoardView`'s change handler reads `appState.activeTool.type`, mirrors the library's own rule (crosshair unless the tool is one of the six it cursors itself), and toggles a `data-crosshair` attribute on the host only when that classification changes. CSS then sets the app's cursor on the interactive canvas while the attribute is present.

**The override needs `!important`, and that is correct here.** The library writes the cursor inline; an author declaration beats an inline one only with `!important`. Specificity is high (host class + attribute + `.excalidraw` + `canvas` + `.interactive`) and the scope is exactly the tools the library would show a crosshair for, so the `!important` cannot reach the selection, hand, eraser, laser, or image cursors.

**The cursor is an inline SVG data URI: an ink-blue cross over an ivory halo, hotspot at the centre.** The halo keeps it legible over dark drawings; the brand stroke keeps it on-palette. It is a data URI so there is no asset to ship or fetch.

**`onChange` fires on tool selection** — verified in the browser — so the attribute tracks the active tool without polling or a second subscription.

Rejected: **a CSS-only `:has()` rule keyed on the checked toolbar radio.** It would need one selector per tool, would miss tools reached by keyboard shortcut if the DOM shape changed, and couples the stylesheet to the library's toolbar markup.

Rejected: **leaving the platform crosshair.** It is the one board surface the palette cannot reach, and it renders blue for at least one user.

## Risks / Trade-offs

- **The `appState.activeTool` shape is the library's** → a package change that moves it degrades to the stock crosshair (the attribute simply never sets), not to a broken board.
- **An invalid cursor value would silently fall back** → verified in the browser that the computed cursor is the SVG data URI, and CSS modules scoping was the one real failure mode found and fixed (`.interactive` must be `:global`).
