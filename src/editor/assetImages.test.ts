import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createAssetImages,
  releaseAssetImages,
  syncAssetImages,
  type AssetImages,
  type ObserverFactory,
} from './assetImages'

// render-vault-images: the pass swaps a vault-relative image URL for the file's
// bytes, once per path, and leaves everything the browser can fetch alone.

function host(html: string): HTMLElement {
  const el = document.createElement('div')
  el.innerHTML = html
  return el
}

function reader(bytes = 'png'): ((path: string) => Promise<Blob>) & { calls: string[] } {
  const calls: string[] = []
  const read = (path: string) => {
    calls.push(path)
    return Promise.resolve(new Blob([bytes]))
  }
  return Object.assign(read, { calls })
}

/** Let the pending read's microtask chain settle. */
const settle = async (): Promise<void> => {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

/** A visibility observer the test drives by hand (design D6). */
type FakeObserver = {
  factory: ObserverFactory
  observed: Element[]
  enter: (el: Element) => void
  exit: (el: Element) => void
}

function fakeObserver(): FakeObserver {
  let callback: ((target: Element, intersecting: boolean) => void) | null = null
  const observed: Element[] = []
  return {
    observed,
    factory: (cb) => {
      callback = cb
      return {
        observe: (target) => observed.push(target),
        unobserve: () => {},
        disconnect: () => {},
      }
    },
    enter: (el) => callback?.(el, true),
    exit: (el) => callback?.(el, false),
  }
}

/** A reader whose promises the test resolves on demand (concurrency tests). */
function deferredReader(): {
  calls: string[]
  read: (path: string) => Promise<Blob>
  resolve: (path: string) => void
} {
  const calls: string[] = []
  const waiting = new Map<string, (blob: Blob) => void>()
  return {
    calls,
    read: (path) => {
      calls.push(path)
      return new Promise<Blob>((resolve) => waiting.set(path, resolve))
    },
    resolve: (path) => {
      const done = waiting.get(path)
      waiting.delete(path)
      done?.(new Blob(['png']))
    },
  }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('syncAssetImages', () => {
  it('resolves a vault image path to a URL for the file bytes', async () => {
    const el = host('<p><img src="assets/photo.png" /></p>')
    const cache = createAssetImages()
    const read = reader()
    syncAssetImages(el, cache, read)
    expect(read.calls).toEqual(['assets/photo.png'])
    await settle()
    const img = el.querySelector('img') as HTMLImageElement
    expect(img.getAttribute('src')).toMatch(/^blob:/)
    expect(cache.urls.get('assets/photo.png')).toBe(img.getAttribute('src'))
    releaseAssetImages(cache)
  })

  it('leaves remote, data, and absolute URLs untouched', () => {
    const el = host(
      '<img src="https://example.com/a.png" /><img src="data:image/png;base64,AAA" /><img src="/abs.png" /><img src="blob:http://x/y" />',
    )
    const cache = createAssetImages()
    const read = reader()
    syncAssetImages(el, cache, read)
    expect(read.calls).toEqual([])
    expect([...el.querySelectorAll('img')].map((i) => i.getAttribute('src'))).toEqual([
      'https://example.com/a.png',
      'data:image/png;base64,AAA',
      '/abs.png',
      'blob:http://x/y',
    ])
  })

  it('reads a path once across repeated passes and keeps its URL', async () => {
    const el = host('<img src="assets/photo.png" />')
    const cache = createAssetImages()
    const read = reader()
    syncAssetImages(el, cache, read)
    await settle()
    const first = el.querySelector('img')?.getAttribute('src')
    // The editor rewrites the element from the document on a later render.
    el.querySelector('img')!.setAttribute('src', 'assets/photo.png')
    syncAssetImages(el, cache, read)
    syncAssetImages(el, cache, read)
    expect(read.calls).toEqual(['assets/photo.png'])
    expect(el.querySelector('img')?.getAttribute('src')).toBe(first)
    releaseAssetImages(cache)
  })

  it('leaves an unresolvable path alone and never reads it again', async () => {
    const el = host('<img src="assets/missing.png" />')
    const cache = createAssetImages()
    const calls: string[] = []
    const read = (path: string) => {
      calls.push(path)
      return Promise.reject(new Error('NotFoundError'))
    }
    syncAssetImages(el, cache, read)
    await settle()
    syncAssetImages(el, cache, read)
    await settle()
    expect(calls).toEqual(['assets/missing.png'])
    expect(el.querySelector('img')?.getAttribute('src')).toBe('assets/missing.png')
    releaseAssetImages(cache)
  })

  it('revokes every URL it created on release', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const el = host('<img src="assets/a.png" /><img src="assets/b.png" />')
    const cache = createAssetImages()
    syncAssetImages(el, cache, reader())
    await settle()
    const created = [...cache.urls.values()]
    expect(created).toHaveLength(2)
    releaseAssetImages(cache)
    expect(revoke.mock.calls.map(([url]) => url)).toEqual(created)
    expect(cache.urls.size).toBe(0)
    revoke.mockRestore()
  })

  it('creates no URL for a read that lands after release', async () => {
    const el = host('<img src="assets/photo.png" />')
    const cache = createAssetImages()
    const create = vi.spyOn(URL, 'createObjectURL')
    syncAssetImages(el, cache, reader())
    releaseAssetImages(cache)
    await settle()
    // The bytes arrive with nobody left to show them: no URL is created, so
    // there is nothing to revoke and nothing to leak.
    expect(create).not.toHaveBeenCalled()
    expect(cache.urls.size).toBe(0)
    expect(el.querySelector('img')?.getAttribute('src')).toBe('assets/photo.png')
    create.mockRestore()
  })

  it('does nothing once released', () => {
    const el = host('<img src="assets/photo.png" />')
    const cache: AssetImages = createAssetImages()
    releaseAssetImages(cache)
    const read = reader()
    syncAssetImages(el, cache, read)
    expect(read.calls).toEqual([])
  })
})

describe('syncAssetImages viewport lifecycle (bound-image-render-cost)', () => {
  it('reads an image when it enters view, not when the pass runs', () => {
    const el = host('<img src="assets/a.png" /><img src="assets/b.png" />')
    const obs = fakeObserver()
    const read = reader()
    const cache = createAssetImages({ observer: obs.factory })
    syncAssetImages(el, cache, read)
    expect(read.calls).toEqual([])
    const [a, b] = [...el.querySelectorAll('img')]
    obs.enter(a)
    expect(read.calls).toEqual(['assets/a.png'])
    obs.enter(b)
    expect(read.calls).toEqual(['assets/a.png', 'assets/b.png'])
    releaseAssetImages(cache)
  })

  it('releases an image that leaves view and reads it again on return', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const el = host('<img src="assets/photo.png" />')
    const obs = fakeObserver()
    const read = reader()
    const cache = createAssetImages({ observer: obs.factory })
    syncAssetImages(el, cache, read)
    const img = el.querySelector('img') as HTMLImageElement
    obs.enter(img)
    await settle()
    expect(img.getAttribute('src')).toMatch(/^blob:/)
    const url = cache.urls.get('assets/photo.png')
    obs.exit(img)
    expect(revoke).toHaveBeenCalledWith(url)
    expect(cache.urls.has('assets/photo.png')).toBe(false)
    expect(img.getAttribute('src')).toBeNull()
    obs.enter(img)
    expect(read.calls).toEqual(['assets/photo.png', 'assets/photo.png'])
    await settle()
    expect(img.getAttribute('src')).toMatch(/^blob:/)
    releaseAssetImages(cache)
    revoke.mockRestore()
  })

  it('keeps a shared path live until its last viewer leaves', async () => {
    const el = host('<img src="assets/photo.png" /><img src="assets/photo.png" />')
    const obs = fakeObserver()
    const cache = createAssetImages({ observer: obs.factory })
    syncAssetImages(el, cache, reader())
    const [a, b] = [...el.querySelectorAll('img')]
    obs.enter(a)
    obs.enter(b)
    await settle()
    expect(cache.urls.has('assets/photo.png')).toBe(true)
    obs.exit(a)
    expect(cache.urls.has('assets/photo.png')).toBe(true)
    obs.exit(b)
    expect(cache.urls.has('assets/photo.png')).toBe(false)
    releaseAssetImages(cache)
  })

  it('caps how many reads are in flight at once', async () => {
    const el = host(
      '<img src="assets/a.png" /><img src="assets/b.png" /><img src="assets/c.png" />',
    )
    const obs = fakeObserver()
    const reader = deferredReader()
    const cache = createAssetImages({ observer: obs.factory, maxConcurrent: 2 })
    syncAssetImages(el, cache, reader.read)
    for (const img of el.querySelectorAll('img')) obs.enter(img)
    expect(reader.calls).toEqual(['assets/a.png', 'assets/b.png'])
    reader.resolve('assets/a.png')
    await settle()
    expect(reader.calls).toEqual(['assets/a.png', 'assets/b.png', 'assets/c.png'])
    releaseAssetImages(cache)
  })

  it('creates no URL for a read that finishes after the image left view', async () => {
    const create = vi.spyOn(URL, 'createObjectURL')
    const el = host('<img src="assets/photo.png" />')
    const obs = fakeObserver()
    const read = reader()
    const cache = createAssetImages({ observer: obs.factory })
    syncAssetImages(el, cache, read)
    const img = el.querySelector('img') as HTMLImageElement
    obs.enter(img)
    expect(read.calls).toEqual(['assets/photo.png'])
    obs.exit(img)
    await settle()
    expect(create).not.toHaveBeenCalled()
    expect(cache.urls.size).toBe(0)
    releaseAssetImages(cache)
    create.mockRestore()
  })

  it('does not retry a path the vault could not read', async () => {
    const el = host('<img src="assets/missing.png" />')
    const obs = fakeObserver()
    const calls: string[] = []
    const read = (path: string) => {
      calls.push(path)
      return Promise.reject(new Error('NotFoundError'))
    }
    const cache = createAssetImages({ observer: obs.factory })
    syncAssetImages(el, cache, read)
    const img = el.querySelector('img') as HTMLImageElement
    obs.enter(img)
    await settle()
    obs.exit(img)
    obs.enter(img)
    await settle()
    expect(calls).toEqual(['assets/missing.png'])
    releaseAssetImages(cache)
  })
})
