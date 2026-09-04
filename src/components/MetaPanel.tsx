import { Accordion } from './Accordion'
import styles from './MetaPanel.module.css'

export function MetaPanel() {
  return (
    <aside className={styles.panel}>
      <Accordion title="Backlinks" defaultOpen>
        <p className="section-placeholder">
          Pages linking to this one appear once a page is open.
        </p>
      </Accordion>
      <Accordion title="Forwardlinks" defaultOpen>
        <p className="section-placeholder">
          Links from this page appear once a page is open.
        </p>
      </Accordion>
    </aside>
  )
}