import { describe, expect, it, vi } from 'vitest'
import { isDisplayable, mimeFor, openVaultPath, openVaultTarget, vaultTarget } from './assetOpen'

// open-vault-assets: which targets in a page open a vault file, what type they
// are served as, and which of the two branches (a window, or a download) they
// take. The openers are stubbed, so these are the decisions alone (design D8).
// `openVaultTarget` takes an href from the document, where a destination is a
// URL; `openVaultPath` (add-asset-navigation) takes a path the vault itself
// listed, which is the file's literal name and must not be decoded.

describe('vaultTarget', () => {
  it('accepts a vault-relative path as it is written', () => {
    expect(vaultTarget('assets/q3-report.pdf')).toBe('assets/q3-report.pdf')
  })

  it('decodes a percent-encoded path to the path the file has', () => {
    expect(vaultTarget('assets/Q3%20report.pdf')).toBe('assets/Q3 report.pdf')
  })

  it('accepts a path whose space is written literally', () => {
    expect(vaultTarget('assets/Q3 report.pdf')).toBe('assets/Q3 report.pdf')
  })

  it('refuses anything that is not a vault path', () => {
    for (const href of [
      '/assets/photo.png',
      'https://example.com/a.pdf',
      'data:application/pdf,',
      'blob:http://localhost/x',
      '#section',
      '',
      'mailto:someone@example.com',
    ]) {
      expect(vaultTarget(href)).toBeNull()
    }
    expect(vaultTarget(null)).toBeNull()
    expect(vaultTarget(undefined)).toBeNull()
  })

  it('refuses an escape the browser cannot decode', () => {
    expect(vaultTarget('assets/%E0%A4%A.pdf')).toBeNull()
  })

  it('leaves a traversal path for the storage contract to reject', () => {
    // Not this module's call: the read is what rejects (ADR-0013).
    expect(vaultTarget('../outside.pdf')).toBe('../outside.pdf')
  })
})

describe('mimeFor', () => {
  it('maps a known extension, case-insensitively', () => {
    expect(mimeFor('assets/a.PDF')).toBe('application/pdf')
    expect(mimeFor('assets/a.png')).toBe('image/png')
    expect(mimeFor('assets/a.json')).toBe('application/json')
  })

  it('falls back for an unknown or missing extension', () => {
    expect(mimeFor('assets/a.xyz')).toBe('application/octet-stream')
    expect(mimeFor('assets/noext')).toBe('application/octet-stream')
    expect(mimeFor('assets/.hidden')).toBe('application/octet-stream')
  })

  it('reads the extension of the file, not of a directory in the path', () => {
    expect(mimeFor('assets/photo.v2/a.txt')).toBe('text/plain')
  })
})

describe('isDisplayable', () => {
  it('splits the types the browser shows from the ones it downloads', () => {
    for (const path of ['a.pdf', 'a.PNG', 'a.mp4', 'a.txt', 'a.svg']) {
      expect(isDisplayable(path)).toBe(true)
    }
    for (const path of ['a.docx', 'a.zip', 'a.md', 'a', 'a.xyz']) {
      expect(isDisplayable(path)).toBe(false)
    }
  })
})

/** A reader that records the paths it was asked for. */
function reader(blob?: Blob, fail = false) {
  const calls: string[] = []
  const read = (path: string) => {
    calls.push(path)
    if (fail) return Promise.reject(new Error('missing'))
    return Promise.resolve(blob ?? new Blob(['bytes']))
  }
  return Object.assign(read, { calls })
}

/** Stubbed openers that record what the gesture asked for. */
function openers(refuseTab = false) {
  const setUrl = vi.fn()
  const close = vi.fn()
  const openTab = vi.fn(() => (refuseTab ? null : { setUrl, close }))
  const download = vi.fn()
  return { openTab, download, setUrl, close }
}

describe('openVaultTarget', () => {
  it('shows a displayable file in a window', async () => {
    const o = openers()
    const read = reader()
    expect(await openVaultTarget('assets/q3-report.pdf', read, o)).toBe(true)
    expect(read.calls).toEqual(['assets/q3-report.pdf'])
    expect(o.openTab).toHaveBeenCalledTimes(1)
    expect(o.setUrl).toHaveBeenCalledTimes(1)
    expect(o.setUrl.mock.calls[0][0]).toMatch(/^blob:/)
    expect(o.download).not.toHaveBeenCalled()
    expect(o.close).not.toHaveBeenCalled()
  })

  it('downloads a file the browser cannot display, naming it', async () => {
    const o = openers()
    const read = reader()
    expect(await openVaultTarget('assets/q3/archive.zip', read, o)).toBe(true)
    expect(o.openTab).not.toHaveBeenCalled()
    expect(o.download).toHaveBeenCalledTimes(1)
    expect(o.download.mock.calls[0][1]).toBe('archive.zip')
  })

  it('falls back to a download when no window could be opened', async () => {
    const o = openers(true)
    expect(await openVaultTarget('assets/q3-report.pdf', reader(), o)).toBe(true)
    expect(o.openTab).toHaveBeenCalledTimes(1)
    expect(o.setUrl).not.toHaveBeenCalled()
    expect(o.download).toHaveBeenCalledTimes(1)
  })

  it('closes the opened window when the vault cannot resolve the path', async () => {
    const o = openers()
    expect(await openVaultTarget('assets/missing.pdf', reader(undefined, true), o)).toBe(false)
    expect(o.openTab).toHaveBeenCalledTimes(1)
    expect(o.close).toHaveBeenCalledTimes(1)
    expect(o.setUrl).not.toHaveBeenCalled()
    expect(o.download).not.toHaveBeenCalled()
  })

  it('opens nothing for a target that is not a vault path', async () => {
    const o = openers()
    const read = reader()
    expect(await openVaultTarget('https://example.com/a.pdf', read, o)).toBe(false)
    expect(read.calls).toEqual([])
    expect(o.openTab).not.toHaveBeenCalled()
    expect(o.download).not.toHaveBeenCalled()
  })

  it('revokes the URL it opened', async () => {
    vi.useFakeTimers()
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const o = openers()
    await openVaultTarget('assets/a.txt', reader(), o)
    const url = o.setUrl.mock.calls[0][0]
    expect(revoke).not.toHaveBeenCalled()
    vi.advanceTimersByTime(120_000)
    expect(revoke).toHaveBeenCalledWith(url)
    vi.useRealTimers()
    revoke.mockRestore()
  })
})

// The second entry point (add-asset-navigation, ADR-0021): a path read from the
// folder listing is the file's literal name, so it is opened exactly as the
// vault spells it rather than as a URL would decode it.
describe('openVaultPath', () => {
  it('reads the literal path, without decoding it', async () => {
    const o = openers()
    const read = reader()
    expect(await openVaultPath('assets/100% done.pdf', read, o)).toBe(true)
    expect(read.calls).toEqual(['assets/100% done.pdf'])
    expect(o.openTab).toHaveBeenCalledTimes(1)
    expect(o.setUrl).toHaveBeenCalledTimes(1)
  })

  it('leaves a path that looks percent-encoded alone', async () => {
    const o = openers()
    const read = reader()
    expect(await openVaultPath('assets/a%20b.pdf', read, o)).toBe(true)
    // The decode belongs to the href side; doing it here would look for a file
    // named `a b.pdf` that the vault does not hold.
    expect(read.calls).toEqual(['assets/a%20b.pdf'])
  })

  it('downloads a type the browser cannot display', async () => {
    const o = openers()
    expect(await openVaultPath('assets/2026/archive.zip', reader(), o)).toBe(true)
    expect(o.openTab).not.toHaveBeenCalled()
    expect(o.download.mock.calls[0][1]).toBe('archive.zip')
  })

  it('closes the window it opened when the file is gone', async () => {
    const o = openers()
    expect(await openVaultPath('assets/gone.pdf', reader(undefined, true), o)).toBe(false)
    expect(o.openTab).toHaveBeenCalledTimes(1)
    expect(o.close).toHaveBeenCalledTimes(1)
    expect(o.setUrl).not.toHaveBeenCalled()
  })
})
