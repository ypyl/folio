// The Pages listing is one row per page, and a vault can hold thousands of them
// (add-history-navigation). Building every row costs seconds of DOM work at
// vault scale, so the listing renders the rows near the viewport and stands a
// spacer in for the rest. This module is the whole decision; the component only
// measures and renders what it returns.

/** One row's height including the list's gap, in px: the row is 6px padding +
 *  14px text = 33px, and `Sidebar.module.css` puts a 2px gap between rows. */
export const ROW_STRIDE = 35

/** Rows rendered beyond the viewport, so a fast scroll does not show a hole. */
export const OVERSCAN = 10

/** A contiguous run of rows to render, or a spacer standing in for the rows
 *  between two runs. `rows` is a count, never a list, so a vault-sized gap
 *  costs one number. */
export type WindowPiece = { kind: 'rows'; indexes: number[] } | { kind: 'gap'; rows: number }

/**
 * Which rows of a fixed-height listing to render for a given scroll position.
 *
 * `keep` (the open page's row) is always rendered, even when it sits far from
 * the viewport, so the listing's current-page marking is never missing from the
 * document. Rendering it costs one row plus the spacers either side of it.
 */
export function windowPieces({
  total,
  stride = ROW_STRIDE,
  viewportHeight,
  scrollTop,
  listTop,
  overscan = OVERSCAN,
  keep,
}: {
  total: number
  stride?: number
  /** The scroll container's visible height; 0 before anything is measured. */
  viewportHeight: number
  /** The scroll container's current offset. */
  scrollTop: number
  /** The listing's offset inside the scroll container, in scroll coordinates. */
  listTop: number
  overscan?: number
  /** A row index that must be rendered even when it is outside the window. */
  keep?: number
}): WindowPiece[] {
  if (total <= 0) return []

  const firstVisible = Math.max(0, Math.floor((scrollTop - listTop) / stride))
  // `+ 1` because the first visible row is usually partly scrolled off.
  const visibleRows = Math.max(1, Math.ceil(viewportHeight / stride) + 1)
  const start = Math.max(0, firstVisible - overscan)
  const end = Math.min(total, firstVisible + visibleRows + overscan)

  const runs: Array<[number, number]> = [[start, end]]
  if (keep !== undefined && keep >= 0 && keep < total && (keep < start || keep >= end)) {
    runs.push([keep, keep + 1])
  }
  runs.sort((a, b) => a[0] - b[0])

  const pieces: WindowPiece[] = []
  let next = 0
  for (const [runStart, runEnd] of runs) {
    if (runStart > next) pieces.push({ kind: 'gap', rows: runStart - next })
    pieces.push({
      kind: 'rows',
      indexes: Array.from({ length: runEnd - runStart }, (_, i) => runStart + i),
    })
    next = runEnd
  }
  if (next < total) pieces.push({ kind: 'gap', rows: total - next })
  return pieces
}
