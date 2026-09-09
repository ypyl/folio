import type { VaultStorage } from './storage'

/** Copy dropped files into the vault's `assets/` folder (asset-drag-drop).
 *  Unique names are resolved against one `assets/` listing snapshot plus the
 *  names claimed within this batch; copies run sequentially so the snapshot
 *  stays accurate (D8): monotonic `-1/-2` counters, landed paths only. Files
 *  whose copy fails are omitted — the caller inserts links only for what
 *  landed (spec: failed copies yield no link). */
export async function copyDroppedFiles(storage: VaultStorage, files: File[]): Promise<string[]> {
  let existing = new Set<string>()
  try {
    // list returns root-relative paths; the uniqueness check is per-basename.
    existing = new Set((await storage.list('assets')).map((p) => p.slice(p.lastIndexOf('/') + 1)))
  } catch {
    // assets/ does not exist yet; the first copy creates it.
  }
  const claimed = new Set<string>()
  const landed: string[] = []
  for (const file of files) {
    const name = uniqueAssetName(file.name, existing, claimed)
    claimed.add(name)
    const path = `assets/${name}`
    try {
      await storage.writeBinary(path, file)
    } catch {
      continue
    }
    existing.add(name)
    landed.push(path)
  }
  return landed
}

/** First unused `name`, then `stem-1.ext`, `stem-2.ext`, … across the
 *  existing listing and the names already claimed in this batch. */
function uniqueAssetName(name: string, existing: Set<string>, claimed: Set<string>): string {
  if (!existing.has(name) && !claimed.has(name)) return name
  const dot = name.lastIndexOf('.')
  const stem = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  for (let i = 1; ; i++) {
    const candidate = `${stem}-${i}${ext}`
    if (!existing.has(candidate) && !claimed.has(candidate)) return candidate
  }
}
