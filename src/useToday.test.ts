import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useToday } from './useToday'

// disallow-past-reminder-days: the day the calendar marks and the day menu's
// guard reads must move at local midnight even when nothing else re-renders.
// Only Date and the timers are faked; React itself stays real.
afterEach(() => {
  vi.useRealTimers()
})

describe('useToday', () => {
  it('reads the local day and holds it until midnight', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 15, 23, 59, 30))
    const { result } = renderHook(() => useToday())

    expect(result.current).toBe('2026-09-15')
    act(() => vi.advanceTimersByTime(20_000))
    expect(result.current).toBe('2026-09-15')
  })

  it('advances to the next day after local midnight', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 15, 23, 59, 30))
    const { result } = renderHook(() => useToday())

    act(() => vi.advanceTimersByTime(31_000))
    expect(result.current).toBe('2026-09-16')
  })

  it('re-reads the day when the tab becomes visible again', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 15, 12, 0, 0))
    const { result } = renderHook(() => useToday())

    // A sleeping machine's timer is late; the wake reports the new day now.
    vi.setSystemTime(new Date(2026, 8, 16, 9, 0, 0))
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current).toBe('2026-09-16')
  })
})
