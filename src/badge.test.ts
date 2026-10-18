import { describe, expect, it, vi } from 'vitest'
import { syncAppBadge, type BadgingNavigator } from './badge'

function fakeNav(): BadgingNavigator {
  return {
    setAppBadge: vi.fn(async () => {}),
    clearAppBadge: vi.fn(async () => {}),
  } as unknown as BadgingNavigator
}

describe('syncAppBadge (add-reminders)', () => {
  it('sets the pending count when there is one', () => {
    const nav = fakeNav()
    syncAppBadge(2, nav)
    expect(nav.setAppBadge).toHaveBeenCalledWith(2)
    expect(nav.clearAppBadge).not.toHaveBeenCalled()
  })

  it('clears the badge at zero', () => {
    const nav = fakeNav()
    syncAppBadge(0, nav)
    expect(nav.clearAppBadge).toHaveBeenCalledTimes(1)
    expect(nav.setAppBadge).not.toHaveBeenCalled()
  })

  it('is a no-op when the browser has no badge API', () => {
    const nav = {} as BadgingNavigator
    expect(() => syncAppBadge(3, nav)).not.toThrow()
  })
})
