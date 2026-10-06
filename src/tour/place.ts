// Card placement for the app tour (add-app-tour). Kept out of Tour.tsx so that
// file exports only the component (fast refresh), and pure so the geometry is
// unit-testable in jsdom, which has no layout.

import type { TourSide } from './steps'

/** A measured region, in viewport coordinates. */
export type Rect = { top: number; left: number; width: number; height: number }
/** A card position, in viewport coordinates. */
export type Pos = { top: number; left: number }

/** The gap between the card and the region it points at. */
const GAP = 12
/** The smallest distance the card keeps from the viewport's edges. */
const PAD = 8

/** Place the card beside its region, flipping to the opposite side and clamping
 *  to the viewport when the preferred side has no room. */
export function placeCard(rect: Rect, side: TourSide, w: number, h: number): Pos {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const clampX = (x: number) => Math.min(Math.max(x, PAD), Math.max(PAD, vw - w - PAD))
  const clampY = (y: number) => Math.min(Math.max(y, PAD), Math.max(PAD, vh - h - PAD))

  let chosen = side
  if (side === 'right' && rect.left + rect.width + GAP + w > vw - PAD) chosen = 'left'
  else if (side === 'left' && rect.left - GAP - w < PAD) chosen = 'right'
  else if (side === 'bottom' && rect.top + rect.height + GAP + h > vh - PAD) chosen = 'top'
  else if (side === 'top' && rect.top - GAP - h < PAD) chosen = 'bottom'

  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  switch (chosen) {
    case 'right':
      return { top: clampY(cy - h / 2), left: clampX(rect.left + rect.width + GAP) }
    case 'left':
      return { top: clampY(cy - h / 2), left: clampX(rect.left - GAP - w) }
    case 'bottom':
      return { top: clampY(rect.top + rect.height + GAP), left: clampX(cx - w / 2) }
    case 'top':
      return { top: clampY(rect.top - GAP - h), left: clampX(cx - w / 2) }
    case 'center':
      return { top: clampY(cy - h / 2), left: clampX(cx - w / 2) }
  }
}
