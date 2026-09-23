// Visible row/column delete controls for the table the caret is in
// (make-table-delete-controls-visible, design D1 to D4).
//
// Deleting a row or column already worked, but only from a handle's hidden
// control group or from a chord, so the pointer path was effectively
// undiscoverable. This plugin puts the two deletions in a small strip on the
// table the caret is in, visible without finding a handle. The strip is Folio
// chrome over the adopted table block (ADR-0017): a sibling of the component's
// content DOM, so ProseMirror never reads it as content, and it reuses the very
// commands the chords use.

import type { Node as ProseNode } from '@milkdown/prose/model'
import type { Command } from '@milkdown/prose/state'
import { Plugin, PluginKey } from '@milkdown/prose/state'
import type { EditorView } from '@milkdown/prose/view'
import { $prose } from '@milkdown/utils'
import { deleteTableColumn, deleteTableRow } from './tableSetup'

/** The strip's class (the stylesheet's hook) and its two controls' names.
 *  Global names, like the badge and image-control classes the editor writes. */
export const TABLE_CONTROLS_CLASS = 'folio-table-controls'

const ROW_LABEL = 'Delete row'
const COLUMN_LABEL = 'Delete column'

const SVG_NS = 'http://www.w3.org/2000/svg'

/** A control's glyph: a minus over the row or column it removes. Drawn here
 *  because the strip is built without React. */
const GLYPH_ROW = 'M2 4h12M2 12h12M4 8h8'
const GLYPH_COLUMN = 'M4 2v12M12 2v12M8 4v8'

/** The table node's position for a selection at `from`, or null when the caret
 *  is not in a table. */
function tablePosition(doc: ProseNode, from: number): number | null {
  const $from = doc.resolve(from)
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === 'table') return $from.before(depth)
  }
  return null
}

/** One control's drawing, hidden from assistive technology because the button
 *  carries the name. */
function glyph(path: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 16 16')
  svg.setAttribute('width', '12')
  svg.setAttribute('height', '12')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '1.25')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  const d = document.createElementNS(SVG_NS, 'path')
  d.setAttribute('d', path)
  svg.append(d)
  return svg
}

/** A control: the drawing plus the name that states the action. The press is
 *  claimed so the editor keeps its selection and focus; the command runs against
 *  the current state, then focus returns to the editor. */
function control(label: string, path: string, run: () => void): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'folio-table-control'
  button.setAttribute('aria-label', label)
  button.title = label
  button.append(glyph(path))
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault()
    event.stopPropagation()
    run()
  })
  return button
}

/** The strip: a group of the two delete controls, inert to ProseMirror. */
function buildStrip(view: EditorView): HTMLElement {
  const strip = document.createElement('div')
  strip.className = TABLE_CONTROLS_CLASS
  strip.setAttribute('contenteditable', 'false')
  strip.setAttribute('role', 'group')
  strip.setAttribute('aria-label', 'Table controls')
  const run = (command: Command) => () => {
    command(view.state, view.dispatch, view)
    view.focus()
  }
  strip.append(
    control(ROW_LABEL, GLYPH_ROW, run(deleteTableRow)),
    control(COLUMN_LABEL, GLYPH_COLUMN, run(deleteTableColumn)),
  )
  return strip
}

export const tableDeleteControls = $prose(
  () =>
    new Plugin({
      key: new PluginKey('folio-table-delete-controls'),
      view: (editorView) => {
        let mountedBlock: HTMLElement | null = null
        let strip: HTMLElement | null = null
        let positionedRow: HTMLElement | null = null

        const clear = () => {
          strip?.remove()
          strip = null
          mountedBlock = null
          positionedRow = null
        }

        /** The `<tr>` the caret is in, for the strip's vertical position, or
         *  null when the caret is not in a rendered row. */
        const caretRow = (): HTMLElement | null => {
          const node = editorView.domAtPos(editorView.state.selection.from).node
          const element = node instanceof Element ? node : node.parentElement
          return element?.closest('tr') ?? null
        }

        /** Mount the strip in the caret's table, or remove it when the caret
         *  leaves. The block is compared by identity, so a keystroke inside the
         *  same table touches nothing; the row is compared the same way, so the
         *  one layout read that places the strip happens only when the caret
         *  changes row. */
        const sync = () => {
          const { state } = editorView
          const pos = tablePosition(state.doc, state.selection.from)
          const block = pos === null ? null : (editorView.nodeDOM(pos) as HTMLElement | null)
          if (!block) {
            if (mountedBlock) clear()
            return
          }
          if (block !== mountedBlock || !strip || !strip.isConnected) {
            clear()
            strip = buildStrip(editorView)
            block.append(strip)
            mountedBlock = block
          }
          const row = caretRow()
          if (row !== positionedRow) {
            positionedRow = row
            strip.style.top = `${row?.offsetTop ?? 0}px`
          }
        }

        sync()
        return { update: sync, destroy: clear }
      },
    }),
)
