import { afterEach, describe, expect, it, vi } from 'vitest'
import { readPrerelease, writePrerelease } from './prerelease'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('prerelease mode (add-prerelease-mode)', () => {
  it('is off by default', () => {
    expect(readPrerelease()).toBe(false)
  })

  it('persists the mode', () => {
    writePrerelease(true)
    expect(readPrerelease()).toBe(true)
    writePrerelease(false)
    expect(readPrerelease()).toBe(false)
  })

  it('reads as off when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('unavailable')
    })
    expect(readPrerelease()).toBe(false)
  })

  it('does not throw when writing to unavailable storage', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('unavailable')
    })
    expect(() => writePrerelease(true)).not.toThrow()
  })
})
