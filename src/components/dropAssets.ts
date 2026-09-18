// File intake helpers for the editor pane (asset-drag-drop, attach-pasted-files).
// Kept out of EditorPane.tsx so the component file fast-refreshes cleanly
// (react(only-export-components)). Both gestures — drop and paste — collect
// their files here and link them via `vault/link`'s `linkForAsset`, which is the
// one rule for the text a vault file is written as (add-asset-references).

import { splitExtension } from '../vault/link'

/** Plain File entries from a drop or a paste; directories are ignored (D3). */
export function collectFiles(dt: DataTransfer): File[] {
  const files: File[] = []
  for (const item of dt.items) {
    if (item.kind !== 'file') continue
    if (item.webkitGetAsEntry?.()?.isDirectory) continue
    const f = item.getAsFile()
    if (f) files.push(f)
  }
  return files
}

/** Clipboard stems that carry no information: a bitmap pasted from the
 *  clipboard arrives as `image.png` in Chromium (or `blob`). */
const GENERIC_PASTE_STEMS = new Set(['image', 'blob', 'clipboard', ''])

/** Two-digit zero pad for a local timestamp part. */
function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Extension for a pasted file: its own, or one derived from the MIME subtype
 *  when the clipboard name has none (attach-pasted-files D3). The extension
 *  matters: the link's form is picked from the path, so a bitmap without one
 *  would attach as a plain link and never render. */
function pastedExtension(name: string, type: string): string {
  const { ext } = splitExtension(name)
  if (ext) return ext
  const subtype = type.split('/')[1]
  return subtype ? `.${subtype}` : ''
}

/** A pasted file, renamed when the clipboard gave it a name that says nothing
 *  (`image.png`, `blob`, no stem at all): repeated screenshots would otherwise
 *  pile up as `image.png`, `image-1.png`, `image-2.png`. A file with a real
 *  name keeps it. The copy flow's unique-name rule still numbers collisions. */
export function withPastedName(file: File): File {
  const dot = file.name.lastIndexOf('.')
  const stem = (dot > 0 ? file.name.slice(0, dot) : file.name).toLowerCase()
  if (!GENERIC_PASTE_STEMS.has(stem)) return file
  const now = new Date()
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  return new File([file], `pasted-${stamp}${pastedExtension(file.name, file.type)}`, {
    type: file.type,
    lastModified: file.lastModified,
  })
}
