// The hold that keeps a fast start from flashing loading shapes
// (show-what-is-loading, design D1/D2): a value that settles inside the hold
// never renders the delayed state at all.

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HOLD_MS, useDelayedFlag } from './useDelayedFlag'

describe('useDelayedFlag', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stays false until the value has held', () => {
    const { result } = renderHook(() => useDelayedFlag(true))
    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(HOLD_MS - 1)
    })
    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe(true)
  })

  it('never turns true for a value that settles inside the hold', () => {
    const { result, rerender } = renderHook(({ value }) => useDelayedFlag(value), {
      initialProps: { value: true },
    })

    act(() => {
      vi.advanceTimersByTime(HOLD_MS / 2)
    })
    rerender({ value: false })

    act(() => {
      vi.advanceTimersByTime(HOLD_MS * 2)
    })
    expect(result.current).toBe(false)
  })

  it('drops back as soon as the value does', () => {
    const { result, rerender } = renderHook(({ value }) => useDelayedFlag(value), {
      initialProps: { value: true },
    })
    act(() => {
      vi.advanceTimersByTime(HOLD_MS)
    })
    expect(result.current).toBe(true)

    rerender({ value: false })
    expect(result.current).toBe(false)
  })

  it('honours a custom hold', () => {
    const { result } = renderHook(() => useDelayedFlag(true, 10))
    act(() => {
      vi.advanceTimersByTime(10)
    })
    expect(result.current).toBe(true)
  })
})
