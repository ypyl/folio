// The touch context-menu gesture (make-the-app-usable-on-a-phone, design D4).
// jsdom has no touch input, so the gesture is driven through React's pointer
// events: what matters here is the decision — hold long enough, stay put, and
// release — and that the release's click reaches nothing.

import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LONG_PRESS_MS, LONG_PRESS_MOVE_PX, useLongPress } from './longPress'

function Harness({
  onLongPress,
}: {
  onLongPress: (point: { x: number; y: number }, el: HTMLElement) => void
}) {
  const handlers = useLongPress(onLongPress)
  return (
    <button type="button" {...handlers}>
      A row
    </button>
  )
}

/** Press, hold for `ms`, and release. */
function hold(ms: number, init: { x?: number; y?: number; pointerType?: string } = {}) {
  const row = screen.getByRole('button', { name: 'A row' })
  fireEvent.pointerDown(row, {
    pointerType: init.pointerType ?? 'touch',
    clientX: init.x ?? 40,
    clientY: init.y ?? 60,
  })
  vi.advanceTimersByTime(ms)
  return row
}

describe('a press and hold opens the menu', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires on release after the hold, with the press point and the row', () => {
    const onLongPress = vi.fn()
    render(<Harness onLongPress={onLongPress} />)
    const row = hold(LONG_PRESS_MS)
    expect(onLongPress).not.toHaveBeenCalled()
    fireEvent.pointerUp(row)
    expect(onLongPress).toHaveBeenCalledTimes(1)
    expect(onLongPress.mock.calls[0]![0]).toEqual({ x: 40, y: 60 })
    expect(onLongPress.mock.calls[0]![1]).toBe(row)
  })

  it('does not fire on a short press', () => {
    const onLongPress = vi.fn()
    render(<Harness onLongPress={onLongPress} />)
    const row = hold(LONG_PRESS_MS - 50)
    fireEvent.pointerUp(row)
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('does not fire when the press moves beyond the threshold', () => {
    const onLongPress = vi.fn()
    render(<Harness onLongPress={onLongPress} />)
    const row = hold(LONG_PRESS_MS / 2)
    fireEvent.pointerMove(row, {
      pointerType: 'touch',
      clientX: 40 + LONG_PRESS_MOVE_PX + 4,
      clientY: 60,
    })
    vi.advanceTimersByTime(LONG_PRESS_MS)
    fireEvent.pointerUp(row)
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('survives a small wobble within the threshold', () => {
    const onLongPress = vi.fn()
    render(<Harness onLongPress={onLongPress} />)
    const row = hold(LONG_PRESS_MS / 2)
    fireEvent.pointerMove(row, { pointerType: 'touch', clientX: 42, clientY: 61 })
    vi.advanceTimersByTime(LONG_PRESS_MS)
    fireEvent.pointerUp(row)
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it('does not fire when the gesture is cancelled', () => {
    const onLongPress = vi.fn()
    render(<Harness onLongPress={onLongPress} />)
    const row = hold(LONG_PRESS_MS)
    fireEvent.pointerCancel(row)
    fireEvent.pointerUp(row)
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('is the mouse’s gesture on a mouse', () => {
    const onLongPress = vi.fn()
    render(<Harness onLongPress={onLongPress} />)
    const row = hold(LONG_PRESS_MS, { pointerType: 'mouse' })
    fireEvent.pointerUp(row)
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('arms a pen as well as a finger', () => {
    const onLongPress = vi.fn()
    render(<Harness onLongPress={onLongPress} />)
    const row = hold(LONG_PRESS_MS, { pointerType: 'pen' })
    fireEvent.pointerUp(row)
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })
})

describe('the release’s click reaches nothing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('swallows exactly the click that follows the hold', () => {
    const onLongPress = vi.fn()
    render(<Harness onLongPress={onLongPress} />)
    const row = hold(LONG_PRESS_MS)
    fireEvent.pointerUp(row)
    // What the platform dispatches next: a click, at whatever the press landed
    // on once the menu rendered.
    const item = document.createElement('button')
    const activated = vi.fn()
    item.addEventListener('click', activated)
    document.body.append(item)
    fireEvent.click(item)
    expect(activated).not.toHaveBeenCalled()
    fireEvent.click(item)
    expect(activated).toHaveBeenCalledTimes(1)
    item.remove()
  })

  it('lets a short press’s click through', () => {
    const onLongPress = vi.fn()
    render(<Harness onLongPress={onLongPress} />)
    const row = hold(LONG_PRESS_MS - 50)
    fireEvent.pointerUp(row)
    const activated = vi.fn()
    row.addEventListener('click', activated)
    fireEvent.click(row)
    expect(activated).toHaveBeenCalledTimes(1)
  })

  it('ends the wait when the next gesture starts', () => {
    const onLongPress = vi.fn()
    render(<Harness onLongPress={onLongPress} />)
    const row = hold(LONG_PRESS_MS)
    fireEvent.pointerUp(row)
    // A release's click follows at once; a new press means it has already been
    // dispatched, so the next deliberate click must not be eaten.
    fireEvent.pointerDown(row, { pointerType: 'mouse', clientX: 40, clientY: 60 })
    fireEvent.pointerUp(row)
    const activated = vi.fn()
    row.addEventListener('click', activated)
    fireEvent.click(row)
    expect(activated).toHaveBeenCalledTimes(1)
  })
})
