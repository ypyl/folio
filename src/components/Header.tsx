import { FolioMark } from '../FolioMark'
import styles from './Header.module.css'

export function Header() {
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
      <div className={styles.slot} />
    </header>
  )
}