// Caret for a press in a table cell (make-table-entry-usable, design D1/D2).
//
// The table block's node view claims the press: for a `mousedown` on a cell the
// caret is not already in, its `stopEvent` returns true and it dispatches a node
// selection on that cell — which prosemirror-tables turns into a CellSelection
// over that one cell. ProseMirror therefore never places a caret, and the next
// keystroke replaces the cell's text, so a click could destroy what a cell held.
// Nothing in the app can act before the node view does; the selection it leaves
// is the handle we have, and this plugin converts it back into a caret.
//
// It keys on the press: a press that landed on a cell is a request to type
// there, while a press on a row or column handle is a request to select that row
// or column, and the two must not be confused (the handles' controls act on the
// selection they make). A press anywhere else leaves the selection alone.
//
// It works on the selection, not on the component, so a component that stops
// selecting cells leaves this a no-op and clicks behave as ordinary text.

import type { Node as ProseNode } from '@milkdown/prose/model'
import { CellSelection } from '@milkdown/prose/tables'
import type { EditorView } from '@milkdown/prose/view'
import { NodeSelection, Plugin, PluginKey, Selection, TextSelection } from '@milkdown/prose/state'
import { $prose } from '@milkdown/utils'

/** A press on a cell, in viewport coordinates, with the moment it happened. */
type Press = { left: number; top: number; at: number }

/** How long a recorded press stays usable as the origin of a caret. The cell
 *  selection is dispatched in the same tick as the press that caused it; the
 *  window only keeps a press that produced no selection from being applied to a
 *  later one. */
const PRESS_WINDOW_MS = 1000

const CELLS = new Set(['table_cell', 'table_header'])

/** The cell a selection picked out, or null when it is not the press of a cell:
 *  a selection over a range of cells (a drag), a node selection outside a table,
 *  or plain text. */
function pressedCell(
  doc: ProseNode,
  selection: Selection,
): { cellPos: number; nodeSize: number } | null {
  if (selection instanceof CellSelection) {
    // A single cell, not a range: the component's press selects one, and a range
    // is a drag the user meant to keep.
    if (selection.$anchorCell.pos !== selection.$headCell.pos) return null
    const cell = selection.$anchorCell.nodeAfter
    if (!cell || !CELLS.has(cell.type.name)) return null
    return { cellPos: selection.$anchorCell.pos, nodeSize: cell.nodeSize }
  }
  if (selection instanceof NodeSelection) {
    if (CELLS.has(selection.node.type.name)) {
      return { cellPos: selection.from, nodeSize: selection.node.nodeSize }
    }
    // The component selects the block inside the cell, not the cell — its
    // `handleClick` resolves to the paragraph — so a node selection on a text
    // block that sits in a cell is the same press.
    if (!selection.node.isTextblock) return null
  } else {
    return null
  }
  const $pos = doc.resolve(Math.min(selection.from + 1, doc.content.size))
  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth)
    if (CELLS.has(node.type.name)) {
      return { cellPos: $pos.before(depth), nodeSize: node.nodeSize }
    }
  }
  return null
}

/** The caret for a press on `cell`: where the pointer was when that position is
 *  inside the cell, otherwise the end of the cell's text — the position typing
 *  appends at. */
function caretFor(
  view: EditorView | null,
  press: Press,
  cell: { cellPos: number; nodeSize: number },
  doc: ProseNode,
): Selection | null {
  const end = cell.cellPos + cell.nodeSize - 1
  if (view) {
    const hit = posAtPoint(view, press)
    // A press on a border resolves to a position in one of the two cells: take
    // it only when it landed inside the cell the press selected.
    if (hit && hit.pos >= cell.cellPos && hit.pos <= end) {
      return TextSelection.near(doc.resolve(hit.pos))
    }
  }
  return Selection.near(doc.resolve(end), -1)
}

/** Where a viewport point sits in the document. Layout-less environments (the
 *  test runner's jsdom) cannot answer, which is why this is guarded: the caller
 *  falls back to the cell's end. */
function posAtPoint(view: EditorView, press: Press): { pos: number } | null {
  try {
    return view.posAtCoords({ left: press.left, top: press.top })
  } catch {
    return null
  }
}

export const tableCellCaret = $prose(() => {
  let press: Press | null = null
  let view: EditorView | null = null
  return new Plugin({
    key: new PluginKey('folio-table-cell-caret'),
    view: (editorView) => {
      view = editorView
      // Capture phase on the editable root: the node view's own handler sits on
      // the cell, deeper in the tree, and runs after this.
      const record = (event: MouseEvent) => {
        const target = event.target
        const onCell = target instanceof Element && target.closest('td, th') !== null
        press = onCell ? { left: event.clientX, top: event.clientY, at: Date.now() } : null
      }
      editorView.dom.addEventListener('mousedown', record, true)
      return {
        destroy: () => {
          editorView.dom.removeEventListener('mousedown', record, true)
          view = null
          press = null
        },
      }
    },
    appendTransaction: (transactions, _oldState, newState) => {
      if (!transactions.some((tr) => tr.selectionSet)) return null
      const selection = newState.selection
      if (!press) return null
      if (Date.now() - press.at > PRESS_WINDOW_MS) return null
      const cell = pressedCell(newState.doc, selection)
      if (!cell) return null
      const caret = caretFor(view, press, cell, newState.doc)
      return caret ? newState.tr.setSelection(caret) : null
    },
  })
})
