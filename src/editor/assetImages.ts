// Vault image resolution (render-vault-images): a page's markdown references
// vault assets by vault-relative path (`![photo](assets/photo.png)`), which the
// browser cannot fetch from the site origin. This module swaps the rendered
// element's URL for the file's bytes, read once per path through the storage
// seam, and leaves the document text alone — the markdown stays canonical
// (ADR-0001), only the DOM is derived.
//
// A plain function over a DOM subtree: no React, no Milkdown. The pane owns the
// cache's lifetime and drives the pass where it already drives the gutter
// (design D2, D5). The one vault import is the shared "what counts as a vault
// path" predicate, which the index's asset extraction reads too.

import { isVaultRelative } from '../vault/assetOpen'

/** Per-page resolution state. `urls` are live object URLs to revoke on
 *  release; `attempted` holds every path already read or in flight, so a path
 *  the vault cannot resolve is never read twice (design D3). */
export type AssetImages = {
  urls: Map<string, string>
  attempted: Set<string>
  released: boolean
}

export function createAssetImages(): AssetImages {
  return { urls: new Map(), attempted: new Set(), released: false }
}

/** Point every vault-relative image under `host` at its file's bytes. Safe to
 *  call on every document change: resolved paths cost one map lookup, and
 *  settled ones are skipped without a read. */
export function syncAssetImages(
  host: HTMLElement,
  cache: AssetImages,
  read: (path: string) => Promise<Blob>,
): void {
  if (cache.released) return
  for (const img of host.querySelectorAll('img')) {
    const src = img.getAttribute('src')
    if (src === null || !isVaultRelative(src)) continue
    const resolved = cache.urls.get(src)
    if (resolved !== undefined) {
      if (img.getAttribute('src') !== resolved) img.src = resolved
      continue
    }
    if (cache.attempted.has(src)) continue
    cache.attempted.add(src)
    void read(src)
      .then((blob) => {
        // A read that lands after the page is gone is dropped, not turned into
        // a URL nobody would revoke.
        if (cache.released) return
        const url = URL.createObjectURL(blob)
        cache.urls.set(src, url)
        // The element may have been replaced by a re-render while the read was
        // in flight; only write to one still in this subtree.
        if (host.contains(img)) img.src = url
      })
      .catch(() => {
        // Unresolvable: the element keeps the path it had, and `attempted`
        // keeps a keystroke from re-reading it (spec: not read again).
      })
  }
}

/** Revoke every URL the page created. Idempotent. */
export function releaseAssetImages(cache: AssetImages): void {
  cache.released = true
  for (const url of cache.urls.values()) URL.revokeObjectURL(url)
  cache.urls.clear()
}
