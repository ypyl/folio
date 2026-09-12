// File intake helpers for the editor pane (asset-drag-drop, attach-pasted-files).
// Kept out of EditorPane.tsx so the component file fast-refreshes cleanly
// (react(only-export-components)). Both gestures — drop and paste — collect
// their files here and link them the same way.

/** Image extensions get an `![..]` link; everything else a plain `[..]` link. */
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'])

/** Markdown link for a copied asset path; link text is the basename's stem. */
export function linkForAsset(path: string): string {
  const base = path.slice(path.lastIndexOf('/') + 1)
  const dot = base.lastIndexOf('.')
  const ext = dot > 0 ? base.slice(dot + 1).toLowerCase() : ''
  const stem = dot > 0 ? base.slice(0, dot) : base
  return ext && IMAGE_EXTENSIONS.has(ext) ? `![${stem}](${path})` : `[${stem}](${path})`
}

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
 *  matters: `linkForAsset` picks the image link from the path, so a bitmap
 *  without one would attach as a plain link and never render. */
function pastedExtension(name: string, type: string): string {
  const dot = name.lastIndexOf('.')
  if (dot > 0) return name.slice(dot)
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
