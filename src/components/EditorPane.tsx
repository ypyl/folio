import { FolioMark } from '../FolioMark'
import styles from './EditorPane.module.css'

export function EditorPane() {
  return (
    <main className={styles.pane}>
      <div className={styles.emptyState}>
        <FolioMark className={styles.mark} />
        <p className={styles.tagline}>Your notes appear here.</p>
      </div>
    </main>
  )
}