import { FolioMark } from '../FolioMark'
import { version } from '../../package.json'
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
      {/* Brand cell: the home button (mark + title) and, beside it, the running
          version (add-version-badge). The badge is a sibling, never a child of
          the button, so the home control keeps its own accessible name and the
          version stays plain, non-interactive text. */}
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
        <span className={styles.version}>{`v${version}`}</span>
      </div>
      <div className={styles.search}>{search}</div>
    </header>
  )
}
