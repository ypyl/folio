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
      <button
        type="button"
        className={styles.brand}
        onClick={onHome}
        title="Go home"
        aria-label="Folio, go home"
      >
        <FolioMark className={styles.mark} />
        <span className={styles.name}>Folio</span>
      </button>
      <div className={styles.search}>{search}</div>
      <div className={styles.slot} />
    </header>
  )
}
