// Viewport placement for the reference-completion popup
// (add-reference-autocomplete, design D5). Pure arithmetic: the caret rect
// comes from `coordsAtPos` and the popup is `position: fixed`, so both are
// already in viewport space and no scroll-container or offsetParent math is
// needed. Only two things are left: flip above when short of room below, and
// clamp into the viewport. Kept out of the plugin so it can be tested without a
// browser.

type CaretRect = {
  left: number
  right: number
  top: number
  bottom: number
}

export type Size = {
  width: number
  height: number
}

/** Distance between the caret and the popup, and the viewport margin. */
const GAP = 4
const PAD = 8

/**
 * Where to put a caret-anchored popup, or null when the caret is outside the
 * viewport (scrolled out of view: there is nothing to anchor to, and parking the
 * box at an edge would float it over unrelated content).
 */
export function popupPlacement(
  caret: CaretRect,
  size: Size,
  viewport: Size,
  gap = GAP,
  pad = PAD,
): { top: number; left: number } | null {
  if (caret.bottom <= 0 || caret.top >= viewport.height) return null
  if (caret.right <= 0 || caret.left >= viewport.width) return null

  // Both caps are floored at `pad` so a popup wider or taller than the viewport
  // still lands at the margin instead of a negative offset.
  const maxTop = Math.max(pad, viewport.height - pad - size.height)
  const maxLeft = Math.max(pad, viewport.width - pad - size.width)

  let top = caret.bottom + gap
  if (top + size.height > viewport.height - pad) {
    const above = caret.top - gap - size.height
    // Above if it fits there, otherwise pin to the bottom margin: the popup has
    // to stay visible even when neither side has room.
    top = above >= pad ? above : maxTop
  }

  return {
    top: Math.max(pad, Math.min(top, maxTop)),
    left: Math.min(Math.max(pad, caret.left), maxLeft),
  }
}
