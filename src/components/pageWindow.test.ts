import { describe, expect, it } from 'vitest'
import {
  COMPACT_ROW_STRIDE,
  OVERSCAN,
  ROW_STRIDE,
  windowPieces,
  type WindowPiece,
} from './pageWindow'

/** Every index the pieces render, in order. */
const rendered = (pieces: WindowPiece[]): number[] =>
  pieces.flatMap((p) => (p.kind === 'rows' ? p.indexes : []))

/** Rows a gap piece stands in for, summed. */
const gaps = (pieces: WindowPiece[]): number =>
  pieces.reduce((sum, p) => sum + (p.kind === 'gap' ? p.rows : 0), 0)

describe('windowPieces (add-history-navigation)', () => {
  it('renders nothing for an empty listing', () => {
    expect(windowPieces({ total: 0, viewportHeight: 600, scrollTop: 0, listTop: 0 })).toEqual([])
  })

  it('renders a listing that fits without spacers', () => {
    const pieces = windowPieces({ total: 5, viewportHeight: 600, scrollTop: 0, listTop: 100 })
    expect(pieces).toEqual([{ kind: 'rows', indexes: [0, 1, 2, 3, 4] }])
    expect(gaps(pieces)).toBe(0)
  })

  it('bounds the rendered rows however long the listing is', () => {
    const pieces = windowPieces({ total: 10_000, viewportHeight: 600, scrollTop: 0, listTop: 0 })
    const rows = rendered(pieces)
    expect(rows.length).toBeLessThan(50)
    // The spacers account for every row not rendered, so the scroll extent is
    // still the whole listing.
    expect(rows.length + gaps(pieces)).toBe(10_000)
  })

  it('follows a deep scroll position', () => {
    const scrollTop = 200_000
    const firstVisible = Math.floor(scrollTop / ROW_STRIDE)
    const rows = rendered(
      windowPieces({ total: 10_000, viewportHeight: 600, scrollTop, listTop: 0 }),
    )
    expect(rows).toContain(firstVisible)
    expect(rows[0]).toBe(firstVisible - OVERSCAN)
  })

  it('accounts for the listing offset inside the container', () => {
    // 400px of sections above the listing: the first visible row follows.
    const rows = rendered(
      windowPieces({ total: 1000, viewportHeight: 600, scrollTop: 0, listTop: 400 }),
    )
    expect(rows[0]).toBe(0)
    expect(rows.length).toBeLessThan(50)
  })

  it('renders a kept row that is outside the window, in place', () => {
    const pieces = windowPieces({
      total: 10_000,
      viewportHeight: 600,
      scrollTop: 0,
      listTop: 0,
      keep: 9_000,
    })
    const rows = rendered(pieces)
    expect(rows).toContain(9_000)
    // In order, and with the gap standing in for everything between the window
    // and the kept row.
    expect([...rows].sort((a, b) => a - b)).toEqual(rows)
    expect(rows.length + gaps(pieces)).toBe(10_000)
  })

  it('adds nothing for a kept row already in the window', () => {
    const pieces = windowPieces({
      total: 10_000,
      viewportHeight: 600,
      scrollTop: 0,
      listTop: 0,
      keep: 5,
    })
    expect(pieces).toEqual(
      windowPieces({ total: 10_000, viewportHeight: 600, scrollTop: 0, listTop: 0 }),
    )
  })

  it('ignores a kept index that is not a row', () => {
    const pieces = windowPieces({
      total: 10_000,
      viewportHeight: 600,
      scrollTop: 0,
      listTop: 0,
      keep: 10_000,
    })
    expect(gaps(pieces)).toBe(10_000 - rendered(pieces).length)
  })

  it('windows a touch-sized row by the stride it is given', () => {
    // The compact listing draws a 46px row (make-the-app-usable-on-a-phone), so
    // the window covers fewer rows for the same viewport, and the offset math
    // follows the taller row rather than the desktop stride.
    const desktop = windowPieces({ total: 10_000, viewportHeight: 600, scrollTop: 0, listTop: 0 })
    const compact = windowPieces({
      total: 10_000,
      viewportHeight: 600,
      scrollTop: 0,
      listTop: 0,
      stride: COMPACT_ROW_STRIDE,
    })
    expect(COMPACT_ROW_STRIDE).toBeGreaterThan(ROW_STRIDE)
    expect(rendered(compact).length).toBeLessThan(rendered(desktop).length)
    expect(rendered(compact).length + gaps(compact)).toBe(10_000)
    // A deep scroll lands on the row a 46px stride puts at that offset.
    const scrollTop = 4600
    expect(
      rendered(
        windowPieces({
          total: 10_000,
          viewportHeight: 600,
          scrollTop,
          listTop: 0,
          stride: COMPACT_ROW_STRIDE,
        }),
      ),
    ).toContain(Math.floor(scrollTop / COMPACT_ROW_STRIDE))
  })
})
