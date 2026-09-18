// What a sidebar row carries when it is dragged into the editor
// (drag-references-into-editor, design D1): the *fact* the row names — a vault
// path, or a page name — never the Markdown it becomes. The editor derives the
// text through the two rules the app already owns (`vault/link`'s
// `linkForAsset`, `vault/parse`'s `referenceToken`), so the sidebar writes no
// syntax and the reference grammar keeps its one writer per form (ADR-0023).
//
// The types are private to the app: an unknown `application/x-` type is ignored
// by any other application a row is dropped onto.

import { linkForAsset } from '../vault/link'
import { referenceToken } from '../vault/parse'

/** Payload naming a file the vault holds; the value is its vault-relative path. */
export const ASSET_DRAG_TYPE = 'application/x-folio-asset'
/** Payload naming a page; the value is its name as it exists on disk. */
export const PAGE_DRAG_TYPE = 'application/x-folio-page'

export type DragRef = { kind: 'asset'; path: string } | { kind: 'page'; name: string }

/** Put `ref` on a drag. `copy` because a drag here copies nothing and creates
 *  nothing: it writes text into the open page and leaves the vault alone. */
export function writeDragRef(dt: DataTransfer, ref: DragRef): void {
  if (ref.kind === 'asset') dt.setData(ASSET_DRAG_TYPE, ref.path)
  else dt.setData(PAGE_DRAG_TYPE, ref.name)
  dt.effectAllowed = 'copy'
}

/** Whether a drag in progress carries one of this app's payloads. During
 *  `dragover` the payload itself is unreadable — the platform exposes only the
 *  types — so this is what a drop target can ask before the drop. */
export function hasDragRef(dt: DataTransfer): boolean {
  return dt.types.includes(ASSET_DRAG_TYPE) || dt.types.includes(PAGE_DRAG_TYPE)
}

/** Read a drag this app produced, or null for anything else — including an
 *  empty value, which names nothing and so writes nothing. */
export function readDragRef(dt: DataTransfer): DragRef | null {
  const path = dt.getData(ASSET_DRAG_TYPE)
  if (path) return { kind: 'asset', path }
  const name = dt.getData(PAGE_DRAG_TYPE)
  if (name) return { kind: 'page', name }
  return null
}

/** The Markdown a dragged row is written as: a link or image for a file, a
 *  reference token for a page — exactly what the typed paths write. */
export function dragRefText(ref: DragRef): string {
  return ref.kind === 'asset' ? linkForAsset(ref.path) : referenceToken(ref.name, 'word')
}
