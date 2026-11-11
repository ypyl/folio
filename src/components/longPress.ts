import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'

// The touch context-menu gesture (make-the-app-usable-on-a-phone, design D4):
// a finger has no right-click, so a press held on a row or a day opens the menu
// the context-menu gesture opens on a pointer device.
//
// The menu opens on release, not the moment the hold elapses: a click follows
// every touch release, and a menu drawn under the finger at that instant would
// take it. Releasing first also means the click that follows can be swallowed
// before it reaches the surface the menu was opened over.
//
// A mouse and a trackpad keep the gesture they already have — a right-click —
// so the pause before the hold, the movement check, and the swallowed click are
// all read from the pointer that produced the event, never from the window's
// width. A hybrid device therefore behaves correctly whichever input it uses.

/** How long a press must hold before the release opens the menu. */
export const LONG_PRESS_MS = 500

/** How far a press may wander and still be a hold rather than a scroll. */
export const LONG_PRESS_MOVE_PX = 8

/** How long the click that follows a release is swallowed for. The click lands
 *  within a frame or two; the bound only keeps a stray click from being eaten
 *  when the platform sends none. */
const CLICK_SWALLOW_MS = 150

export type LongPressPoint = { x: number; y: number }

/** Whether this pointer is a finger or a pen rather than a mouse. */
function isTouchPointer(pointerType: string): boolean {
  return pointerType === 'touch' || pointerType === 'pen'
}

/**
 * Pointer handlers that turn a held press into one callback, with the element
 * the gesture started on. Spread them onto every element that owns a menu: the
 * callback receives the press point and the trigger, so one host can serve a
 * whole listing without a hook per row.
 */
export function useLongPress(onLongPress: (point: LongPressPoint, trigger: HTMLElement) => void): {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void
} {
  const timer = useRef<number | null>(null)
  const origin = useRef<LongPressPoint | null>(null)
  const trigger = useRef<HTMLElement | null>(null)
  const armed = useRef(false)
  const cancelSwallow = useRef<(() => void) | null>(null)

  const stop = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    origin.current = null
    trigger.current = null
    armed.current = false
  }, [])

  // A held press ends in a release, and a release is a click. Whatever the
  // click's target becomes once the menu has rendered, it is not the user's
  // intent, so exactly one click is swallowed at the document's capture phase.
  const swallowNextClick = useCallback(() => {
    // Only one release can be pending; a second one replaces the first rather
    // than stacking listeners on the document.
    cancelSwallow.current?.()
    let settled = false
    let timeout = 0
    const finish = () => {
      if (settled) return
      settled = true
      document.removeEventListener('click', swallow, true)
      document.removeEventListener('pointerdown', finish, true)
      window.clearTimeout(timeout)
      cancelSwallow.current = null
    }
    const swallow = (event: MouseEvent) => {
      if (settled) return
      event.preventDefault()
      event.stopPropagation()
      finish()
    }
    document.addEventListener('click', swallow, true)
    // The click follows the release within a frame or two, before any new
    // gesture can start: a fresh press means the release's click is behind us,
    // so it ends the wait instead of being eaten.
    document.addEventListener('pointerdown', finish, true)
    timeout = window.setTimeout(finish, CLICK_SWALLOW_MS)
    cancelSwallow.current = finish
  }, [])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!isTouchPointer(event.pointerType)) return
      stop()
      origin.current = { x: event.clientX, y: event.clientY }
      trigger.current = event.currentTarget
      timer.current = window.setTimeout(() => {
        timer.current = null
        armed.current = true
      }, LONG_PRESS_MS)
    },
    [stop],
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const start = origin.current
      if (start === null) return
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > LONG_PRESS_MOVE_PX) stop()
    },
    [stop],
  )

  const onPointerUp = useCallback(() => {
    const start = origin.current
    const element = trigger.current
    const held = armed.current
    stop()
    if (!held || start === null || element === null) return
    swallowNextClick()
    onLongPress(start, element)
  }, [onLongPress, stop, swallowNextClick])

  const onPointerCancel = useCallback(() => stop(), [stop])

  // A timer left behind by a closed pane, an armed flag that outlives the
  // gesture, and a pending click swallow are the same leak; unmounting ends all
  // three.
  useEffect(
    () => () => {
      stop()
      cancelSwallow.current?.()
    },
    [stop],
  )

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel }
}
