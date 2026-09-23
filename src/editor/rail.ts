// The left rail (move-list-folds-to-the-left-rail; mark-search-matches-on-the-
// page): the fold controls for list items, drawn in the document's left margin.
// The geometry is pure so it can be tested without a browser, and the pass is
// split into a measurement phase and a write phase so one layout serves every
// control in an update.

import type { FoldTarget } from './editor'
import { FOLD_HEAD_CLASS } from './foldLists'

/** The rail's fold-control class: a global name, because the rail writes the
 *  buttons and the pane delegates their clicks. */
export const FOLD_ARROW_CLASS = 'folio-fold-arrow'

/** The fold control's box height, so its chevron centres on the line. */
const ARROW_MARKER_HEIGHT = 14

export type Rect = { top: number; height: number }

type BlockMetrics = {
  /** The item's own box. */
  block: Rect
  /** The item's first text line, when it has one; otherwise the box is the
   *  fallback (an item whose first block holds no text). */
  line: Rect | null
  /** The control sits at the item's top edge instead of being centred. */
  pinToTop: boolean
}

/**
 * Where a control sits, as an offset from the rail's top: centred on the item's
 * first text line, which is more accurate than the box (a heading's glyphs sit
 * inside a taller line box).
 */
export function numberOffset(
  metrics: BlockMetrics,
  hostTop: number,
  markerHeight = ARROW_MARKER_HEIGHT,
): number {
  if (metrics.pinToTop) return metrics.block.top - hostTop
  const box = metrics.line ?? metrics.block
  return box.top - hostTop + (box.height - markerHeight) / 2
}

/** First text node inside a node (for its first line box), else null. */
function firstTextNode(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) return node
  for (const child of node.childNodes) {
    const hit = firstTextNode(child)
    if (hit) return hit
  }
  return null
}

/** A fold control to render: where it sits, its state, and its target index. */
type RailArrow = {
  top: number
  folded: boolean
  index: number
}

/** A fold control on the rail, its box centred on the item's first text line
 *  (or the head block when it holds no text). Read phase. */
function measureArrows(host: HTMLElement, folds: readonly FoldTarget[]): RailArrow[] {
  // No fold items, no layout read: a page without lists pays nothing extra.
  if (folds.length === 0) return []
  const hostTop = host.getBoundingClientRect().top
  const range = document.createRange()
  return folds.map((fold, index) => {
    const head = fold.element.querySelector(`.${FOLD_HEAD_CLASS}`) ?? fold.element
    const text = firstTextNode(head)
    let line: Rect | null = null
    if (text) {
      range.selectNodeContents(text)
      const rect =
        typeof range.getClientRects === 'function' ? range.getClientRects()[0] : undefined
      if (rect) line = { top: rect.top, height: rect.height }
    }
    const block = head.getBoundingClientRect()
    return {
      top: numberOffset(
        { block: { top: block.top, height: block.height }, line, pinToTop: false },
        hostTop,
        ARROW_MARKER_HEIGHT,
      ),
      folded: fold.folded,
      index,
    }
  })
}

const SVG_NS = 'http://www.w3.org/2000/svg'
/** Chevron pointing down when expanded and right when folded, on the 24-unit
 *  viewBox the app's other controls use. */
const GLYPH_EXPANDED = 'M6 9l6 6 6-6'
const GLYPH_FOLDED = 'M9 6l6 6-6 6'

/** The chevron: one SVG whose path is swapped by state. */
function arrowGlyph(folded: boolean): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', folded ? GLYPH_FOLDED : GLYPH_EXPANDED)
  svg.append(path)
  return svg
}

/** One fold control: a real button, labelled by the action it performs. */
function arrowButton(arrow: RailArrow): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = FOLD_ARROW_CLASS
  button.dataset.foldIndex = String(arrow.index)
  const label = arrow.folded ? 'Expand item' : 'Collapse item'
  button.setAttribute('aria-expanded', String(!arrow.folded))
  button.setAttribute('aria-label', label)
  button.title = label
  button.style.top = `${arrow.top}px`
  button.append(arrowGlyph(arrow.folded))
  return button
}

/** The write phase: build the controls and insert them once. */
function writeRail(host: HTMLElement, arrows: readonly RailArrow[]): void {
  const fragment = document.createDocumentFragment()
  for (const arrow of arrows) fragment.appendChild(arrowButton(arrow))
  host.replaceChildren(fragment)
}

/**
 * One rail update: measure every fold item first, write every control after.
 */
export function updateRailDom(host: HTMLElement, folds: readonly FoldTarget[] = []): void {
  writeRail(host, measureArrows(host, folds))
}
