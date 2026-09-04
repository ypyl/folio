import { Accordion } from './Accordion'
import styles from './Sidebar.module.css'

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <button type="button" className={`btn-secondary ${styles.newPageBtn}`}>
        New Page
      </button>
      <Accordion title="Journal" defaultOpen>
        <p className="section-placeholder">The calendar arrives with the journal step.</p>
      </Accordion>
      <Accordion title="Pages" defaultOpen>
        <p className="section-placeholder">Pages appear here once a vault is open.</p>
      </Accordion>
    </aside>
  )
}