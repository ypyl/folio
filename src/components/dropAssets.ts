// Drop helpers for the editor pane (asset-drag-drop). Kept out of
// EditorPane.tsx so the component file fast-refreshes cleanly
// (react(only-export-components)).

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

/** Plain File entries from a drop; dropped directories are ignored (D3). */
export function collectDropFiles(dt: DataTransfer): File[] {
  const files: File[] = []
  const items = dt.items
  if (items) {
    for (const item of items) {
      if (item.kind !== 'file') continue
      if (item.webkitGetAsEntry?.()?.isDirectory) continue
      const f = item.getAsFile()
      if (f) files.push(f)
    }
  } else {
    for (const f of dt.files) files.push(f)
  }
  return files
}
