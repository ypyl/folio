import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import styles from './RowContextMenu.module.css'

// The page-row context menu (add-row-context-menu, row-context-menu spec). One
// small floating surface with a fixed set of items — not a menu framework. The
// sidebar owns whether it is open and where it was invoked; this component owns
// the box: clamping to the viewport, moving focus in and out, the arrow-key
// moves, and the dismissals. It is positioned `fixed` from the invocation
// point, so it escapes the listing's scroll box without a portal (the sidebar
// has no transformed ancestor).

/** One action in the menu. The label is both the visible text and the
 *  accessible name — the two items are literal strings, so they are the same. */
export type RowMenuItem = {
  label: string
  onSelect: () => void
}

/** Keep the box this far inside every viewport edge when clamping. */
const VIEWPORT_MARGIN = 8

export function RowContextMenu({
  x,
  y,
  items,
  restoreFocusTo,
  onClose,
}: {
  /** The invocation point, viewport-relative (clientX/clientY). */
  x: number
  y: number
  items: RowMenuItem[]
  /** The row the menu belongs to; focus returns here when the menu leaves. */
  restoreFocusTo: HTMLElement | null
  /** Close the menu. Every dismissal and every item activation funnels here;
   *  the owner clears its open state. */
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x, top: y })

  // Measure once, then shift the box back inside the viewport where it would
  // overflow an edge, and put focus on the first item so the menu opens
  // keyboard-operable however it was invoked.
  useLayoutEffect(() => {
    const el = menuRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    setPos({
      left: Math.max(VIEWPORT_MARGIN, Math.min(x, window.innerWidth - width - VIEWPORT_MARGIN)),
      top: Math.max(VIEWPORT_MARGIN, Math.min(y, window.innerHeight - height - VIEWPORT_MARGIN)),
    })
    el.querySelector('button')?.focus()
  }, [x, y])

  // Dismiss on a pointer press outside the box, on any scroll (the listing
  // scrolling is the row's context moving under the menu), and when the window
  // loses focus or resizes.
  useEffect(() => {
    const onPointerDown = (e: Event) => {
      if (!menuRef.current?.contains(e.target as Node)) onClose()
    }
    const dismiss = () => onClose()
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('scroll', dismiss, true)
    window.addEventListener('blur', dismiss)
    window.addEventListener('resize', dismiss)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('blur', dismiss)
      window.removeEventListener('resize', dismiss)
    }
  }, [onClose])

  // Focus returns to the row on the way out, whichever way the menu left. A row
  // that has unmounted (the listing is windowed) is not a focus target.
  useEffect(
    () => () => {
      if (restoreFocusTo?.isConnected) restoreFocusTo.focus()
    },
    [restoreFocusTo],
  )

  const move = (to: number) => {
    const buttons = [...(menuRef.current?.querySelectorAll('button') ?? [])]
    buttons[Math.max(0, Math.min(to, buttons.length - 1))]?.focus()
  }

  // Arrow keys move between items without wrapping, and Home/End jump to the
  // ends. Enter and Space need no handling: the items are buttons.
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const buttons = [...(menuRef.current?.querySelectorAll('button') ?? [])]
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      move(current + 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      move(current - 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      move(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      move(buttons.length - 1)
    }
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      className={styles.menu}
      style={{ left: pos.left, top: pos.top }}
      onKeyDown={onKeyDown}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          className={styles.item}
          onClick={() => {
            item.onSelect()
            onClose()
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
