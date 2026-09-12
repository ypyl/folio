import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createAssetImages,
  releaseAssetImages,
  syncAssetImages,
  type AssetImages,
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
