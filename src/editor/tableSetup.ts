// The table slice (add-table-editing, design D1/D2/D5): GFM tables without the
// GFM preset. The editor keeps the commonmark preset (ADR-0008), and the preset
// that adds tables also adds autolink literals, task lists, footnotes, and a
// strikethrough mark — and rewrites a bare URL in the file as `<…>`, which the
// pane's own requirement forbids. So the parts are registered by name and the
// GFM grammar is replaced by its table part alone.
//
// By name, not by filtering `@milkdown/preset-gfm`'s exported arrays: those
// arrays are flat lists of their items, so an identity filter against an
// exported wrapper (say `remarkGFMPlugin`) silently leaves that item in place —
// the failure would be invisible (`https://…` rewritten in the file) instead of
// a build error. A whitelist fails at compile time when an export is renamed.

import type { RenderType } from '@milkdown/components/table-block'
import { commandsCtx } from '@milkdown/core'
import type { RemarkPluginRaw } from '@milkdown/transformer'
import { $remark, $useKeymap } from '@milkdown/utils'
import {
  addColAfterCommand,
  addColBeforeCommand,
  addRowAfterCommand,
  addRowBeforeCommand,
  autoInsertSpanPlugin,
  deleteSelectedCellsCommand,
  exitTable,
  goToNextTableCellCommand,
  goToPrevTableCellCommand,
  insertTableCommand,
  insertTableInputRule,
  keepTableAlignPlugin,
  moveColCommand,
  moveRowCommand,
  selectColCommand,
  selectRowCommand,
  setAlignCommand,
  tableCellSchema,
  tableEditingPlugin,
  tableHeaderRowSchema,
  tableHeaderSchema,
  tableKeymap,
  tableRowSchema,
  tableSchema,
} from '@milkdown/preset-gfm'
import { gfmTable } from 'micromark-extension-gfm-table'
import { gfmTableFromMarkdown, gfmTableToMarkdown } from 'mdast-util-gfm-table'

/** The three extension lists a remark plugin feeds. `data()` is untyped at the
 *  unified boundary, so the shape is named here and read once. */
type MarkdownExtensions = {
  micromarkExtensions?: unknown[]
  fromMarkdownExtensions?: unknown[]
  toMarkdownExtensions?: unknown[]
}

/** remark-gfm's table grammar and nothing else (design D2): the micromark
 *  syntax, the mdast reader, and the writer that keeps column alignment. The
 *  packages are the ones `remark-gfm` itself bundles, so this adds no grammar,
 *  it only declines the rest of it — which is what keeps a bare URL in a page
 *  exactly the characters the user typed. */
const remarkTablesPlugin: RemarkPluginRaw<null> = function (this: unknown) {
  const data = (this as { data: () => MarkdownExtensions }).data()
  const add = (field: keyof MarkdownExtensions, value: unknown) => {
    const list = data[field] ?? (data[field] = [])
    list.push(value)
  }
  add('micromarkExtensions', gfmTable())
  add('fromMarkdownExtensions', gfmTableFromMarkdown())
  add('toMarkdownExtensions', gfmTableToMarkdown())
}

export const remarkTables = $remark('folioTables', () => remarkTablesPlugin)

/** One control's glyph: Folio's own drawing, in the panel's ink (`currentColor`
 *  is set by the pane's stylesheet), hidden from assistive technology because
 *  the label beside it carries the name. */
const glyph = (paths: string): string =>
  `<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" aria-hidden="true" focusable="false">${paths}</svg>`

/** A control's markup: the drawing, then the label that names it. The component
 *  fills a `span.milkdown-icon` with whatever this returns, so a control's
 *  accessible name has to travel inside it — the label is hidden from sight by
 *  the pane's stylesheet, not from assistive technology (design D4). */
const control = (paths: string, label: string): string =>
  glyph(paths) + `<span class="table-icon-label">${label}</span>`

/** The table block's controls, drawn as Folio markup (design D4). The component
 *  asks for one by role; the labels say what each does in the page's terms. */
export function tableRenderButton(renderType: RenderType): string {
  switch (renderType) {
    case 'add_row':
      return control('<path d="M8 3v10M3 8h10" />', 'Add row below')
    case 'add_col':
      return control('<path d="M8 3v10M3 8h10" />', 'Add column right')
    case 'delete_row':
      return control('<path d="M3 8h10" />', 'Delete row')
    case 'delete_col':
      return control('<path d="M3 8h10" />', 'Delete column')
    case 'align_col_left':
      return control('<path d="M2 4h12M2 8h8M2 12h5" />', 'Align column left')
    case 'align_col_center':
      return control('<path d="M2 4h12M4 8h8M5 12h6" />', 'Align column center')
    case 'align_col_right':
      return control('<path d="M2 4h12M6 8h8M9 12h5" />', 'Align column right')
    case 'col_drag_handle':
      return control('<path d="M6 4h4M6 8h4M6 12h4" />', 'Drag or select column')
    case 'row_drag_handle':
      return control('<path d="M4 6v4M8 6v4M12 6v4" />', 'Drag or select row')
  }
}

/** Folio's own table chords (design D5). The component's controls are pointer
 *  gestures on spans, so these are the keyboard path to the structural edits:
 *  insert a table, add a row below the caret's row, add a column to its right.
 *  Navigation (Tab, Shift-Tab) and the exit (Enter) come from `tableKeymap`, the
 *  preset's own, and are documented rather than rebound. */
export const tableChords = $useKeymap('folioTableChords', {
  InsertTable: {
    shortcuts: 'Mod-Alt-t',
    command: (ctx) => () => ctx.get(commandsCtx).call(insertTableCommand.key, { row: 3, col: 3 }),
  },
  AddRow: {
    shortcuts: 'Mod-Alt-Enter',
    command: (ctx) => () => ctx.get(commandsCtx).call(addRowAfterCommand.key),
  },
  AddCol: {
    shortcuts: 'Mod-Alt-Shift-Enter',
    command: (ctx) => () => ctx.get(commandsCtx).call(addColAfterCommand.key),
  },
})

/** Everything the editor registers for tables (design D1). The schemas and the
 *  input rule parse, serialize, and align; `tableKeymap` navigates; the plugins
 *  keep alignment and host the cells; the commands are the ones the component
 *  resolves by key — drag handles select and move, the delete control removes,
 *  the alignment control sets, and the counters add.
 *
 *  The preset's `tablePasteRule` is deliberately absent (design D3): the app's
 *  own paste handler claims every text paste and reads only `text/plain`, so
 *  ProseMirror's paste rules never run for one, and a pasted Markdown table
 *  arrives through the parser instead. It becomes relevant only if a later
 *  change routes HTML pastes through ProseMirror. */
export const tableSlice = [
  // Each of these is a pair (a context plus the plugin) — the preset flattens
  // them the same way — so they are spread to register both halves.
  ...tableSchema,
  ...tableHeaderRowSchema,
  ...tableRowSchema,
  ...tableHeaderSchema,
  ...tableCellSchema,
  insertTableInputRule,
  ...tableKeymap,
  keepTableAlignPlugin,
  autoInsertSpanPlugin,
  tableEditingPlugin,
  goToNextTableCellCommand,
  goToPrevTableCellCommand,
  exitTable,
  insertTableCommand,
  addRowBeforeCommand,
  addRowAfterCommand,
  addColBeforeCommand,
  addColAfterCommand,
  selectRowCommand,
  selectColCommand,
  moveRowCommand,
  moveColCommand,
  setAlignCommand,
  deleteSelectedCellsCommand,
  ...remarkTables,
  ...tableChords,
]
