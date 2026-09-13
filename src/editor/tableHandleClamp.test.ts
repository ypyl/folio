import { describe, expect, it } from 'vitest'
import { isTableHandle, nudgeIntoPane } from './tableHandleClamp'

// keep-table-handles-in-the-pane: the pane is a scroll container, so its box is
// a hard clip, and the component places a table's handles relative to the row or
// cell they belong to. The geometry is pure so it can be checked without a
// browser; the DOM pass that uses it is verified in Chrome.
const pane = { top: 64, left: 315, right: 1005, bottom: 700 }

describe('nudgeIntoPane', () => {
  it('leaves a handle that already fits', () => {
    expect(nudgeIntoPane({ top: 100, left: 400, right: 418, bottom: 118 }, pane)).toBeNull()
  })

  it('pushes a handle below the pane edge down into it', () => {
    const handle = { top: 50, left: 400, right: 418, bottom: 68 }
    expect(nudgeIntoPane(handle, pane)).toEqual({ dx: 0, dy: 16 })
  })

  it('pulls a handle above the pane bottom up into it', () => {
    const handle = { top: 690, left: 400, right: 418, bottom: 708 }
    expect(nudgeIntoPane(handle, pane)?.dy).toBe(-10)
  })

  it('pushes a handle past the left edge right, and one past the right edge left', () => {
    expect(nudgeIntoPane({ top: 200, left: 310, right: 328, bottom: 218 }, pane)?.dx).toBe(7)
    expect(nudgeIntoPane({ top: 200, left: 995, right: 1013, bottom: 218 }, pane)?.dx).toBe(-10)
  })

  it('keeps the margin between the handle and the edge', () => {
    const handle = { top: 64, left: 400, right: 418, bottom: 82 }
    expect(nudgeIntoPane(handle, pane, 2)).toEqual({ dx: 0, dy: 2 })
    expect(nudgeIntoPane(handle, pane, 0)).toBeNull()
  })

  it('moves on both axes when a handle is outside a corner', () => {
    expect(nudgeIntoPane({ top: 40, left: 300, right: 318, bottom: 58 }, pane)).toEqual({
      dx: 17,
      dy: 26,
    })
  })
})

// D3: the pass moves the two chips the user presses, and never the indicators a
// drag in progress is steered by (the component reads those boxes for its drop
// offsets). The browser check cannot drive a native drag, so the rule is pinned
// here and the roles it matches were read off the live DOM.
describe('isTableHandle', () => {
  const element = (role: string) => {
    const el = document.createElement('div')
    el.dataset.role = role
    return el
  }

  it('touches the row and column chips', () => {
    expect(isTableHandle(element('row-drag-handle'))).toBe(true)
    expect(isTableHandle(element('col-drag-handle'))).toBe(true)
  })

  it('leaves the drag line indicators and the control group alone', () => {
    expect(isTableHandle(element('x-line-drag-handle'))).toBe(false)
    expect(isTableHandle(element('y-line-drag-handle'))).toBe(false)
    expect(isTableHandle(element('button-group'))).toBe(false)
    expect(isTableHandle(document.createElement('td'))).toBe(false)
  })
})
