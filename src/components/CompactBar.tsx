import { useRef, useState } from 'react'
import { RowContextMenu, type RowMenuItem } from './RowContextMenu'
import styles from './CompactBar.module.css'

// The compact app bar (make-the-phone-read-like-an-app, design D3): one 56px
// bar above every compact view, naming the view and carrying the open page's
// actions. It is a phone surface only; the wide shell has no bar, so App
// renders this one only at the compact breakpoint.

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <circle cx="12" cy="5" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="12" cy="19" r="1.8" fill="currentColor" />
    </svg>
  )
}

export function CompactBar({
  title,
  titleAction,
  titleLabel,
  actions,
  status,
}: {
  /** The view's name, already resolved by App (page, board, folder, view). */
  title: string
  /** Locate the open item, where the item supports it: the title becomes a
   *  control with this action. Absent, the title is text. */
  titleAction?: () => void
  /** The title control's accessible name, naming the action and the surface it
   *  locates (e.g. "Reveal Notes.md in Files"). Defaults to the title. */
  titleLabel?: string
  /** The open page's row menu items. Empty or absent, no actions control is
   *  drawn. */
  actions?: RowMenuItem[]
  /** The save-state line under the title (give-the-phone-a-navigation-bar):
   *  announced as a status, and absent on the brand screen. */
  status?: string | null
}) {
  const [menu, setMenu] = useState<{ x: number; y: number; trigger: HTMLElement } | null>(null)
  const actionsRef = useRef<HTMLButtonElement | null>(null)
  const hasActions = actions !== undefined && actions.length > 0

  const toggleMenu = () => {
    if (!hasActions) return
    if (menu !== null) {
      setMenu(null)
      return
    }
    const trigger = actionsRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    setMenu({ x: rect.left, y: rect.bottom + 4, trigger })
  }

  return (
    <header className={styles.bar}>
      <div className={styles.titleBlock}>
        {titleAction ? (
          <button
            type="button"
            className={styles.title}
            aria-label={titleLabel ?? title}
            onClick={titleAction}
          >
            {title}
          </button>
        ) : (
          <span className={styles.title}>{title}</span>
        )}
        {status ? (
          <span className={styles.status} role="status">
            {status}
          </span>
        ) : null}
      </div>
      {hasActions ? (
        <button
          ref={actionsRef}
          type="button"
          className={styles.actions}
          aria-label="Page actions"
          aria-haspopup="menu"
          aria-expanded={menu !== null}
          onClick={toggleMenu}
        >
          <MoreIcon />
        </button>
      ) : null}
      {menu !== null && actions !== undefined ? (
        <RowContextMenu
          x={menu.x}
          y={menu.y}
          items={actions}
          restoreFocusTo={menu.trigger}
          onClose={() => setMenu(null)}
        />
      ) : null}
    </header>
  )
}
