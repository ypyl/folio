import { FolioMark } from '../FolioMark'
import type { ReactNode } from 'react'
import styles from './Header.module.css'

interface HeaderProps {
  vaultName?: string
  fileCount?: number
  /** The search control, composed by App (search-notes): the header only
   *  positions it in the content column; behavior lives in the component. */
  search?: ReactNode
  /** Brand home control (close-folders): making no folder active and
   *  showing the empty state. Optional for isolated header rendering. */
  onHome?: () => void
}

// Display-only slot (D4): the active folder's name and file count as text.
// All folder actions live on the rail; the slot must not open a picker,
// switch folders, or re-grant permission.
export function Header({ vaultName, fileCount, search, onHome }: HeaderProps) {
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
      <div className={styles.slot}>
        {vaultName !== undefined && fileCount !== undefined ? (
          <span className={styles.vaultStatus} title={`${vaultName} (${fileCount} files)`}>
            <span className={styles.vaultName}>{vaultName}</span>
            <span className={styles.vaultCount}>· {fileCount}</span>
          </span>
        ) : null}
      </div>
    </header>
  )
}