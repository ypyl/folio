import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  SHORTCUTS_DIALOG_ID,
  SHORTCUT_GROUPS,
  displayKeys,
} from './shortcuts'
import styles from './ShortcutsDialog.module.css'

// Keyboard-shortcuts reference (keyboard-shortcuts-help): the header's `?`
// button opens this dialog. The listed shortcuts live in ./shortcuts.
export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus contract (keyboard-shortcuts-help): opening moves focus into the
  // dialog; closing returns it to whatever opened it (the header button).
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
    }
  }, [])

  return createPortal(
    <div
      className={styles.overlay}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
      // Outside-click dismissal: activating the scrim (the overlay itself)
      // closes the dialog. Clicks inside the dialog target its children,
      // so they bubble with a different target and never close it.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        id={SHORTCUTS_DIALOG_ID}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        tabIndex={-1}
        className={styles.dialog}
      >
        <div className={styles.head}>
          <h2 className={styles.title}>Keyboard shortcuts</h2>
          <button
            type="button"
            className={styles.close}
            aria-label="Close keyboard shortcuts"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {SHORTCUT_GROUPS.map((group) => (
          <section key={group.heading} className={styles.group}>
            <h3 className={styles.groupHeading}>{group.heading}</h3>
            <ul className={styles.list}>
              {group.items.map((item) => (
                <li key={item.label} className={styles.row}>
                  <span className={styles.label}>{item.label}</span>
                  <span className={styles.keys}>
                    {item.keys.map((k) => (
                      <kbd key={k} className={styles.kbd}>
                        {displayKeys(k)}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>,
    document.body,
  )
}