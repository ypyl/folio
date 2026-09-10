// Line-number gutter placement (bound-editor-per-keystroke-work, design D2).
// The geometry is pure so it can be tested without a browser, and the DOM pass
// is split into a measurement phase and a write phase so one layout serves every
// number in an update: interleaving a read with a write per block made each
// block force a fresh layout of the whole document, which cost 1.5 s on a
// 1500-block page.

/** Height of a gutter number's line box, matching `.gutterNum`'s font size. */
export const GUTTER_MARKER_HEIGHT = 12

export type Rect = { top: number; height: number }

export type BlockMetrics = {
  /** The block's own box. */
  block: Rect
  /** The block's first text line, when it has one; otherwise the block box is
   *  the fallback (an empty placeholder block has no text line). */
  line: Rect | null
  /** The code-block component's wrapper: a tall panel, not a prose line. */
  isCodeBlock: boolean
}

/**
 * Where a block's number sits, as an offset from the gutter's top. A code block
 * is pinned to the panel's top edge, because centring on a code line would read
 * as "middle of the block"; prose is centred on the first text line, which is
 * more accurate than the block box (a heading's glyphs sit inside a taller line
 * box).
 */
export function numberOffset(
  metrics: BlockMetrics,
  hostTop: number,
  markerHeight = GUTTER_MARKER_HEIGHT,
): number {
  if (metrics.isCodeBlock) return metrics.block.top - hostTop
  const box = metrics.line ?? metrics.block
  return box.top - hostTop + (box.height - markerHeight) / 2
}

/** First text node inside a block (for its first line box), else null. */
export function firstTextNode(node: Node): Node | null {
  if (node.nodeType === Node.TEXT_NODE) return node
  for (const child of node.childNodes) {
    const hit = firstTextNode(child)
    if (hit) return hit
  }
  return null
}

/** A number to render, with the offset its span's `top` gets. */
export type GutterNumber = {
  line: number
  top: number
}

/**
 * Measure every block, then write every number (design D2). Both phases stay in
 * this function so the ordering is one place, and so a test can assert it:
 * every `getBoundingClientRect`/`getClientRects` in an update happens before the
 * first `replaceChildren`, span creation, or `style.top` write.
 */
export function measureNumbers(
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
    if (!isCodeBlock) {
      const text = firstTextNode(block)
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
    }
    numbers.push({
      line,
      top: numberOffset(
        {
          block: { top: blockRect.top, height: blockRect.height },
          line: lineRect,
          isCodeBlock,
        },
        hostTop,
      ),
    })
  })
  return numbers
}

/** The write phase: build the spans and insert them once. */
export function writeNumbers(
  host: HTMLElement,
  numbers: readonly GutterNumber[],
  className: string,
): void {
  const fragment = document.createDocumentFragment()
  for (const number of numbers) {
    const span = document.createElement('span')
    span.textContent = String(number.line)
    span.className = className
    span.style.top = `${number.top}px`
    fragment.appendChild(span)
  }
  host.replaceChildren(fragment)
}

/** One gutter update: measure every block first, write every number after. */
export function updateGutterDom(
  host: HTMLElement,
  blocks: readonly Element[],
  lines: readonly number[],
  className: string,
): void {
  writeNumbers(host, measureNumbers(host, blocks, lines), className)
}
