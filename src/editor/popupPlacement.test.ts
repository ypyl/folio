import { describe, expect, it } from 'vitest'
import { popupPlacement } from './popupPlacement'

// Caret at x=100, on the line whose box is y=200..220 (viewport space).
const caret = { left: 100, right: 101, top: 200, bottom: 220 }
const viewport = { width: 1000, height: 800 }
const size = { width: 200, height: 120 }

describe('popupPlacement', () => {
  it('sits just below the caret when there is room', () => {
    expect(popupPlacement(caret, size, viewport)).toEqual({ top: 224, left: 100 })
  })

  it('flips above the caret when the viewport bottom is close', () => {
    const low = { ...caret, top: 700, bottom: 720 }
    expect(popupPlacement(low, size, viewport)).toEqual({ top: 576, left: 100 })
  })

  it('pins to the bottom margin when neither side fits', () => {
    const tall = { width: 200, height: 790 }
    expect(popupPlacement(caret, tall, viewport)).toEqual({ top: 8, left: 100 })
  })

  it('clamps to the right margin', () => {
    const right = { ...caret, left: 980, right: 981 }
    expect(popupPlacement(right, size, viewport)).toEqual({ top: 224, left: 792 })
  })

  it('clamps to the left margin', () => {
    const left = { ...caret, left: 1, right: 2 }
    expect(popupPlacement(left, size, viewport)).toEqual({ top: 224, left: 8 })
  })

  it('keeps a popup larger than the viewport inside the margin', () => {
    const huge = { width: 1200, height: 900 }
    expect(popupPlacement(caret, huge, viewport)).toEqual({ top: 8, left: 8 })
  })

  it('hides when the caret is scrolled out of view', () => {
    expect(popupPlacement({ ...caret, top: -40, bottom: -20 }, size, viewport)).toBeNull()
    expect(popupPlacement({ ...caret, top: 820, bottom: 840 }, size, viewport)).toBeNull()
    expect(popupPlacement({ ...caret, left: -40, right: -20 }, size, viewport)).toBeNull()
    expect(popupPlacement({ ...caret, left: 1010, right: 1030 }, size, viewport)).toBeNull()
  })
})
