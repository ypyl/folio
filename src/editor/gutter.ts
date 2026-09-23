// Line-number gutter placement (bound-editor-per-keystroke-work, design D2).
// The geometry is pure so it can be tested without a browser, and the DOM pass
// is split into a measurement phase and a write phase so one layout serves every
// number in an update: interleaving a read with a write per block made each
// block force a fresh layout of the whole document, which cost 1.5 s on a
// 1500-block page.

import type { FoldTarget } from './editor'
import { FOLD_HEAD_CLASS } from './foldLists'

/** Height of a gutter number's line box, matching `.gutterNum`'s font size. */
export const GUTTER_MARKER_HEIGHT = 12

/** The rail's fold-control class (move-list-folds-to-the-left-rail): a global
 *  name, because the rail writes the buttons and the pane delegates their
 *  clicks. */
export const FOLD_ARROW_CLASS = 'folio-fold-arrow'

/** The fold control's box height, so its chevron centres on the line. */
const ARROW_MARKER_HEIGHT = 14

const SVG_NS = 'http://www.w3.org/2000/svg'
/** Chevron pointing down when expanded and right when folded, on the 24-unit
 *  viewBox the app's other controls use. */
const GLYPH_EXPANDED = 'M6 9l6 6 6-6'
const GLYPH_FOLDED = 'M9 6l6 6-6 6'

export type Rect = { top: number; height: number }

type BlockMetrics = {
  /** The block's own box. */
  block: Rect
  /** The block's first text line, when it has one; otherwise the block box is
   *  the fallback (an empty placeholder block has no text line). */
  line: Rect | null
  /** The block's number sits at its top edge instead of being centred on a
   *  line: a code-block panel (a tall panel, not a prose line), or a block
   *  whose content is not text at all — an image on its own line. Centring
   *  either one reads as "middle of the block" rather than "first line". */
  pinToTop: boolean
}

/** Content whose box is the thing itself rather than text: a block holding
 *  only these has no text line to centre a number on. */
const REPLACED_CONTENT = 'img, video, canvas, iframe'

/**
 * Where a block's number sits, as an offset from the gutter's top. A code block
 * and a block of non-text content are pinned to the block's top edge, because
 * centring on them would read as "middle of the block"; prose is centred on the
 * first text line, which is more accurate than the block box (a heading's
 * glyphs sit inside a taller line box).
 */
export function numberOffset(
  metrics: BlockMetrics,
  hostTop: number,
  markerHeight = GUTTER_MARKER_HEIGHT,
): number {
  if (metrics.pinToTop) return metrics.block.top - hostTop
  const box = metrics.line ?? metrics.block
  return box.top - hostTop + (box.height - markerHeight) / 2
}

/** First text node inside a block (for its first line box), else null. */
function firstTextNode(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) return node
  for (const child of node.childNodes) {
    const hit = firstTextNode(child)
    if (hit) return hit
  }
  return null
}

/** A number to render, with the offset its span's `top` gets. */
type GutterNumber = {
  line: number
  top: number
}

/**
 * Measure every block, then write every number (design D2). Both phases stay in
 * this function so the ordering is one place, and so a test can assert it:
 * every `getBoundingClientRect`/`getClientRects` in an update happens before the
 * first `replaceChildren`, span creation, or `style.top` write.
 */
function measureNumbers(
  host: HTMLElement,
  blocks: readonly Element[],
  lines: readonly number[],
): GutterNumber[] {
  const hostTop = host.getBoundingClientRect().top
  // One Range for the whole update: measuring a text line per block does not
  // need a new one each time.
  const range = document.createRange()
  const numbers: GutterNumber[] = []
  blocks.forEach((block, index) => {
    const line = lines[index]
    if (line === undefined) return
    const isCodeBlock = block.classList.contains('milkdown-code-block')
    const blockRect = block.getBoundingClientRect()
    let lineRect: Rect | null = null
    // A code block's own text lives in its embedded editor, so it never
    // contributes a line here; anything else with no text at all has no line to
    // centre on either.
    const text = isCodeBlock ? null : firstTextNode(block)
    if (text) {
      range.selectNodeContents(text)
      // A real browser always has this; jsdom does not, and the gutter's own
      // tests run there. Without the guard the measurement throws and the
      // numbers silently stay empty, which is how it behaved before this
      // change was measured.
      const rect =
        typeof range.getClientRects === 'function' ? range.getClientRects()[0] : undefined
      if (rect) lineRect = { top: rect.top, height: rect.height }
    }
    const pinToTop =
      isCodeBlock || (text === null && block.querySelector(REPLACED_CONTENT) !== null)
    numbers.push({
      line,
      top: numberOffset(
        {
          block: { top: blockRect.top, height: blockRect.height },
          line: lineRect,
          pinToTop,
        },
        hostTop,
      ),
    })
  })
  return numbers
}

/** A fold control to render: where it sits, its state, and its nesting. */
type GutterArrow = {
  line: number
  folded: boolean
  depth: number
  index: number
}

/** A fold control on the rail, its box centred on the item's first text line
 *  (or the head block when it holds no text). Read phase, like the numbers. */
function measureArrows(host: HTMLElement, folds: readonly FoldTarget[]): GutterArrow[] {
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
      line: numberOffset(
        { block: { top: block.top, height: block.height }, line, pinToTop: false },
        hostTop,
        ARROW_MARKER_HEIGHT,
      ),
      folded: fold.folded,
      depth: fold.depth,
      index,
    }
  })
}

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
function arrowButton(arrow: GutterArrow): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = FOLD_ARROW_CLASS
  button.dataset.foldIndex = String(arrow.index)
  const label = arrow.folded ? 'Expand item' : 'Collapse item'
  button.setAttribute('aria-expanded', String(!arrow.folded))
  button.setAttribute('aria-label', label)
  button.title = label
  button.style.top = `${arrow.line}px`
  button.append(arrowGlyph(arrow.folded))
  return button
}

/** The write phase: build the numbers and controls and insert them once. */
function writeRail(
  host: HTMLElement,
  numbers: readonly GutterNumber[],
  arrows: readonly GutterArrow[],
  className: string,
): void {
  const fragment = document.createDocumentFragment()
  for (const number of numbers) {
    const span = document.createElement('span')
    span.textContent = String(number.line)
    span.className = className
    span.style.top = `${number.top}px`
    // A number is presentational; the rail's fold controls are the only
    // interactive, announced part of it (move-list-folds-to-the-left-rail).
    span.setAttribute('aria-hidden', 'true')
    fragment.appendChild(span)
  }
  for (const arrow of arrows) fragment.appendChild(arrowButton(arrow))
  host.replaceChildren(fragment)
}

// ponytail: one update measures every top-level block, so a keystroke costs
// O(blocks) (~8 ms at 1500 blocks, sub-ms at ordinary page sizes). Left as-is
// because long pages are hypothetical; if they become real, replace the JS
// measurement with a per-block widget decoration and let the browser position
// the numbers.

/**
 * One rail update: measure every block and fold item first, write every number
 * and control after. The number column and the control column are placed
 * independently, so a fold control and its block's number share a line without
 * one moving the other (split-the-left-rail-into-columns).
 */
export function updateGutterDom(
  host: HTMLElement,
  blocks: readonly Element[],
  lines: readonly number[],
  className: string,
  folds: readonly FoldTarget[] = [],
): void {
  writeRail(host, measureNumbers(host, blocks, lines), measureArrows(host, folds), className)
}
