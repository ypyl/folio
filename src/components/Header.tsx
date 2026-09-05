import { FolioMark } from '../FolioMark'
import styles from './Header.module.css'

interface HeaderProps {
  vaultName?: string
  fileCount?: number
}

// Display-only slot (D4): the active folder's name and file count as text.
// All folder actions live on the rail; the slot must not open a picker,
// switch folders, or re-grant permission.
export function Header({ vaultName, fileCount }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <FolioMark className={styles.mark} />
        <span className={styles.name}>Folio</span>
      </div>
      {/* Inert until the search step: layout only, no behavior. */}
      <div className={styles.search}>
        <input
          className={styles.input}
          type="text"
          placeholder="Search notes"
          aria-label="Search notes"
        />
      </div>
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