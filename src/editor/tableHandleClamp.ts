// Handles the pane would clip (change: keep-table-handles-in-the-pane).
//
// The table block's node view places the row and column handles itself, with a
// floating placement against the row or the cell they belong to. The pane is a
// scroll container, so its box is a hard clip: a handle above the pane's top
// edge — a table scrolled until its first row sits at that edge — cannot be
// pressed, and there is no scrolling that helps, because the table is already as
// low as the pane can show it. Nothing can move the table out of that position,
// so the handle is nudged inside the pane each time the component places it.

type Rect = { top: number; left: number; right: number; bottom: number }

type Nudge = { dx: number; dy: number }

/** The nudge that brings `handle` inside `pane` with `margin` to spare, or null
 *  when it already fits. Pure, so the geometry is testable without a browser —
 *  as the gutter's geometry is. */
export function nudgeIntoPane(handle: Rect, pane: Rect, margin = 2): Nudge | null {
  const dx =
    handle.left < pane.left + margin
      ? pane.left + margin - handle.left
      : handle.right > pane.right - margin
        ? pane.right - margin - handle.right
        : 0
  const dy =
    handle.top < pane.top + margin
      ? pane.top + margin - handle.top
      : handle.bottom > pane.bottom - margin
        ? pane.bottom - margin - handle.bottom
        : 0
  return dx === 0 && dy === 0 ? null : { dx, dy }
}

/** The handles this pass touches: the row and column chips the user presses. The
 *  line handles that appear during a drag are deliberately outside it — a drag is
 *  driven by the pointer, and the component reads those boxes for the drop
 *  indicator's offsets. */
const TABLE_HANDLES = '[data-role="row-drag-handle"], [data-role="col-drag-handle"]'

/** Whether an element is one of the handles this pass may move. */
export function isTableHandle(element: Element): boolean {
  return element.matches(TABLE_HANDLES)
}

/** The nearest ancestor that scrolls: the pane, whose box is the clip. */
function scrollContainer(el: HTMLElement): HTMLElement | null {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY
    if (overflow === 'auto' || overflow === 'scroll') return node
  }
  return null
}

/** Keep the table's row and column handles inside the pane's visible box for as
 *  long as the editor lives. Returns the cleanup. */
export function keepTableHandlesInThePane(root: HTMLElement): () => void {
  const pane = scrollContainer(root)
  if (!pane) return () => {}
  const place = () => {
    const paneRect = pane.getBoundingClientRect()
    for (const handle of root.querySelectorAll<HTMLElement>(TABLE_HANDLES)) {
      const nudge = nudgeIntoPane(handle.getBoundingClientRect(), paneRect)
      if (!nudge) continue
      // The component writes the placement in the block's coordinate space, which
      // is the same space a nudge is measured in: viewport pixels.
      handle.style.top = `${(parseFloat(handle.style.top) || 0) + nudge.dy}px`
      handle.style.left = `${(parseFloat(handle.style.left) || 0) + nudge.dx}px`
    }
  }
  // The component writes that placement inline as the pointer moves over a
  // table; every other style change in the document is ignored, and this
  // write's own echo finds nothing to do, so it settles in one pass.
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      const target = record.target
      if (target instanceof Element && isTableHandle(target)) {
        place()
        return
      }
    }
  })
  observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['style'] })
  // A handle already placed moves with the content when the pane scrolls, and the
  // component does not reposition it until the pointer moves again: the pane's
  // scroll is the other way a handle ends up outside its box. A scroll that takes
  // the handle out of view docks it at the edge instead, which keeps it pressable
  // for as long as it is shown; the component hides it when the pointer leaves.
  pane.addEventListener('scroll', place, { passive: true })
  return () => {
    observer.disconnect()
    pane.removeEventListener('scroll', place)
  }
}
