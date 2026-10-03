// Vault image resolution (render-vault-images, bounded by
// bound-image-render-cost): a page's markdown references vault assets by
// vault-relative path (`![photo](assets/photo.png)`), which the browser cannot
// fetch from the site origin. This module swaps a rendered element's URL for
// the file's bytes, read through the storage seam, and leaves the document text
// alone — the markdown stays canonical (ADR-0001), only the DOM is derived.
//
// Resolution is scoped to what is needed for display (design D1/D2): an image
// is read when it enters the pane's viewport and its bytes are released when it
// leaves, so the bytes an open page holds do not grow with the number of images
// its markdown references. Reads are capped (D3), a path the vault cannot read
// is never retried (D5), and the wrapper carries `data-resolved` so the
// stylesheet needs no `:has()` (D4).
//
// A plain function over a DOM subtree: no React, no editor. The pane owns the
// cache's lifetime and drives the pass where it already drives the gutter. The
// one vault import is the shared "what counts as a vault path" predicate, which
// the index's asset extraction reads too.

import { decodeVaultPath, isVaultRelative } from '../vault/assetOpen'

/** How far outside the pane's viewport an image still counts as needed. One
 *  viewport of lead keeps fast scrolling from showing empty boxes, at the cost
 *  of holding roughly two viewports of images live (design D2). */
const DEFAULT_ROOT_MARGIN = '100% 0px'

/** How many vault reads may be in flight at once (design D3). A small number
 *  keeps a slow or synced disk from being hit by one read per image at once. */
const DEFAULT_MAX_CONCURRENT = 3

/** The wrapper class the node view renders around a vault image. */
const WRAPPER_CLASS = 'folio-image'

/** A browser-provided "is this element in view" signal (design D6). */
export type VisibilityObserver = {
  observe(target: Element): void
  unobserve(target: Element): void
  disconnect(): void
}

/** Builds the visibility observer. Injected so the resolve/release lifecycle
 *  is unit-testable without a browser (design D6). */
export type ObserverFactory = (
  callback: (target: Element, intersecting: boolean) => void,
  root: Element | null,
  rootMargin: string,
) => VisibilityObserver

export type AssetImagesOptions = {
  /** The scroll container whose viewport decides what is needed (design D1). */
  root?: Element | null
  /** How far outside that viewport an image still counts as needed (D2). */
  rootMargin?: string
  /** How many vault reads may be in flight at once (D3). */
  maxConcurrent?: number
  /** Test seam: replaces the real IntersectionObserver (D6). */
  observer?: ObserverFactory
}

/** Per-page resolution state. `urls` are live object URLs to revoke; `elements`
 *  are the rendered vault images, `visible` those the observer currently
 *  reports as needed; `paths` remembers which vault path each element was
 *  rendered for even after its `src` became a `blob:` URL. `failed` holds every
 *  path already read and refused, so a path the vault cannot resolve is never
 *  read twice (design D5). */
export type AssetImages = {
  urls: Map<string, string>
  elements: Set<HTMLImageElement>
  visible: Set<HTMLImageElement>
  paths: WeakMap<HTMLImageElement, string>
  failed: Set<string>
  reading: Set<string>
  queue: string[]
  observer: VisibilityObserver | null
  read: ((path: string) => Promise<Blob>) | null
  released: boolean
  root: Element | null
  rootMargin: string
  maxConcurrent: number
  observerFactory: ObserverFactory
}

/** The real IntersectionObserver. Where it does not exist (jsdom, a browser too
 *  old for it) every observed element is reported as visible at once, which is
 *  the eager resolution this module had before the viewport window (design D6). */
const browserObserver: ObserverFactory = (callback, root, rootMargin) => {
  if (typeof IntersectionObserver === 'undefined') {
    return {
      observe: (target) => callback(target, true),
      unobserve: () => {},
      disconnect: () => {},
    }
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) callback(entry.target, entry.isIntersecting)
    },
    { root, rootMargin },
  )
  return {
    observe: (target) => observer.observe(target),
    unobserve: (target) => observer.unobserve(target),
    disconnect: () => observer.disconnect(),
  }
}

export function createAssetImages(options: AssetImagesOptions = {}): AssetImages {
  return {
    urls: new Map(),
    elements: new Set(),
    visible: new Set(),
    paths: new WeakMap(),
    failed: new Set(),
    reading: new Set(),
    queue: [],
    observer: null,
    read: null,
    released: false,
    root: options.root ?? null,
    rootMargin: options.rootMargin ?? DEFAULT_ROOT_MARGIN,
    maxConcurrent: options.maxConcurrent ?? DEFAULT_MAX_CONCURRENT,
    observerFactory: options.observer ?? browserObserver,
  }
}

/** Whether any element still on screen is showing `path`. */
function hasVisible(cache: AssetImages, path: string): boolean {
  for (const img of cache.visible) {
    if (cache.paths.get(img) === path) return true
  }
  return false
}

/** Point a rendered element at its path's live bytes and tell the stylesheet the
 *  control may appear. */
function applyUrl(cache: AssetImages, img: HTMLImageElement, path: string): void {
  const url = cache.urls.get(path)
  if (url === undefined) return
  if (img.getAttribute('src') !== url) img.setAttribute('src', url)
  img.closest(`.${WRAPPER_CLASS}`)?.setAttribute('data-resolved', '')
}

/** Release one element's bytes. The box the image occupied is kept (its own
 *  pixel size becomes a width/height attribute), so releasing does not reflow
 *  the document below it (design D2). */
function clearUrl(img: HTMLImageElement): void {
  if (img.naturalWidth > 0) {
    img.width = img.naturalWidth
    img.height = img.naturalHeight
  }
  img.removeAttribute('src')
  img.closest(`.${WRAPPER_CLASS}`)?.removeAttribute('data-resolved')
}

/** Revoke a path's URL and blank every element still showing it. */
function releasePath(cache: AssetImages, path: string): void {
  const url = cache.urls.get(path)
  if (url === undefined) return
  URL.revokeObjectURL(url)
  cache.urls.delete(path)
  for (const img of cache.elements) {
    if (cache.paths.get(img) === path) clearUrl(img)
  }
}

/** Start as many queued reads as the in-flight cap allows, one read per path. */
function pump(cache: AssetImages): void {
  while (cache.reading.size < cache.maxConcurrent && cache.queue.length > 0) {
    const path = cache.queue.shift() as string
    if (cache.urls.has(path) || cache.failed.has(path) || cache.reading.has(path)) continue
    const read = cache.read
    if (read === null) return
    cache.reading.add(path)
    read(path)
      .then((blob) => {
        cache.reading.delete(path)
        // A read that lands after release, or after the image left the
        // viewport, is dropped rather than turned into a URL nobody needs.
        if (cache.released || !hasVisible(cache, path)) {
          pump(cache)
          return
        }
        const url = URL.createObjectURL(blob)
        cache.urls.set(path, url)
        for (const img of cache.elements) {
          if (cache.paths.get(img) === path) applyUrl(cache, img, path)
        }
        pump(cache)
      })
      .catch(() => {
        // Unresolvable: the element keeps the path it had, and `failed` keeps a
        // scroll from re-reading it (spec: not read again).
        cache.reading.delete(path)
        cache.failed.add(path)
        pump(cache)
      })
  }
}

/** Queue a path for reading unless it is already live, queued, in flight, or
 *  known-good-and-failed. */
function enqueue(cache: AssetImages, path: string): void {
  if (
    cache.urls.has(path) ||
    cache.failed.has(path) ||
    cache.reading.has(path) ||
    cache.queue.includes(path)
  ) {
    return
  }
  cache.queue.push(path)
  pump(cache)
}

function enter(cache: AssetImages, img: HTMLImageElement): void {
  cache.visible.add(img)
  const path = cache.paths.get(img)
  if (path === undefined) return
  if (cache.urls.has(path)) applyUrl(cache, img, path)
  else enqueue(cache, path)
}

function exit(cache: AssetImages, img: HTMLImageElement): void {
  cache.visible.delete(img)
  const path = cache.paths.get(img)
  if (path === undefined) return
  // Only the last element showing a shared path releases its bytes.
  if (!hasVisible(cache, path)) releasePath(cache, path)
}

/** Point every vault-relative image under `host` at its file's bytes as it
 *  becomes needed for display. Safe to call on every document change: it
 *  registers images with the viewport observer and re-applies bytes already
 *  read, and it never reads the vault itself. */
export function syncAssetImages(
  host: HTMLElement,
  cache: AssetImages,
  read: (path: string) => Promise<Blob>,
): void {
  if (cache.released) return
  cache.read = read
  if (cache.observer === null) {
    cache.observer = cache.observerFactory(
      (target, intersecting) => {
        if (cache.released) return
        const img = target as HTMLImageElement
        if (!cache.elements.has(img)) return
        if (intersecting) enter(cache, img)
        else exit(cache, img)
      },
      cache.root,
      cache.rootMargin,
    )
  }

  const seen = new Set<HTMLImageElement>()
  for (const img of host.querySelectorAll('img')) {
    const known = cache.paths.get(img)
    const src = img.getAttribute('src')
    // The path the element names, decoded: a markdown destination writes `%20`
    // where the file's name has a space, so the path as written names no file.
    // Registration, reading, and release all key on this, never on the raw
    // attribute — the same rule the index and the open gesture use (ADR-0010).
    const named = src !== null && isVaultRelative(src) ? decodeVaultPath(src) : null
    // An element we already own shows either those same characters, our `blob:`
    // URL, or nothing (released). Only a re-point at a *different* path makes it
    // a new image.
    if (known !== undefined && (src === null || named === null || named === known)) {
      seen.add(img)
      if (cache.urls.has(known)) applyUrl(cache, img, known)
      continue
    }
    if (known !== undefined) {
      // Reused element, re-pointed (or no longer a vault image): drop the old
      // registration before deciding what it is now.
      cache.elements.delete(img)
      cache.visible.delete(img)
      cache.paths.delete(img)
      cache.observer.unobserve(img)
      if (!hasVisible(cache, known)) releasePath(cache, known)
    }
    if (named === null) continue
    seen.add(img)
    cache.paths.set(img, named)
    cache.elements.add(img)
    cache.observer.observe(img)
  }

  // Elements the editor replaced are gone from the host: drop them so a stale
  // registration cannot keep a path's bytes alive (design D2).
  for (const img of [...cache.elements]) {
    if (seen.has(img) || img.isConnected) continue
    cache.elements.delete(img)
    cache.visible.delete(img)
    cache.paths.delete(img)
    cache.observer.unobserve(img)
  }

  // A path whose last viewer vanished without an exit event has nothing left to
  // show; release it so its bytes do not outlive the display need.
  for (const path of [...cache.urls.keys()]) {
    if (!hasVisible(cache, path)) releasePath(cache, path)
  }
}

/** Revoke every URL the page created and stop observing. Idempotent. */
export function releaseAssetImages(cache: AssetImages): void {
  cache.released = true
  cache.observer?.disconnect()
  cache.observer = null
  for (const url of cache.urls.values()) URL.revokeObjectURL(url)
  cache.urls.clear()
  cache.queue.length = 0
  cache.reading.clear()
  cache.visible.clear()
  cache.elements.clear()
}
