import { FolioMark } from '../FolioMark'
import type { ReactNode } from 'react'
import styles from './Header.module.css'

interface HeaderProps {
  /** The search control, composed by App (search-notes): the header only
   *  positions it in the content column; behavior lives in the component. */
  search?: ReactNode
  /** Brand home control (close-folders): making no folder active and
   *  showing the empty state. Optional for isolated header rendering. */
  onHome?: () => void
}

// Header (add-status-bar): brand + content-width search. The right slot is
// deliberately empty — the vault's name, file count, and the question-mark
// help button moved to the status bar. The slot column stays so the header
// still mirrors the workspace's columns (ui-shell).
export function Header({ search, onHome }: HeaderProps) {
  return (
    <header className={styles.header}>
      {/* Brand cell: the home button (mark + title). The running version used
          to sit beside it (add-version-badge); it now reads at the meta
          panel's bottom-right corner (move-version-to-panel). */}
      <div className={styles.brand}>
        <button
          type="button"
          className={styles.brandButton}
          onClick={onHome}
          title="Go home"
          aria-label="Folio, go home"
        >
          <FolioMark className={styles.mark} />
          <span className={styles.name}>Folio</span>
        </button>
      </div>
      <div className={styles.search}>{search}</div>
    </header>
  )
}
