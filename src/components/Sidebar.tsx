import { Accordion } from './Accordion'
import type { Page } from '../page'
import styles from './Sidebar.module.css'

// Receives page data via props (design decision 3): components never import
// the mock module directly, so the real index can swap it at App only.
export function Sidebar({
  pages,
  journalEntries,
  active,
  onSelect,
}: {
  pages: Page[]
  journalEntries: Page[]
  active: Page | null
  onSelect: (page: Page) => void
}) {
  const renderRow = (page: Page) => (
    <button
      key={page.title}
      type="button"
      className={styles.row}
      data-active={page === active || undefined}
      aria-current={page === active ? 'page' : undefined}
      onClick={() => onSelect(page)}
    >
      <span className={styles.rowText}>{page.title}</span>
    </button>
  )

  return (
    <aside className={styles.sidebar}>
      <button type="button" className={`btn-secondary ${styles.newPageBtn}`}>
        New Page
      </button>
      <Accordion title="Journal" defaultOpen>
        <div className={styles.list}>{journalEntries.map(renderRow)}</div>
      </Accordion>
      <Accordion title="Pages" defaultOpen>
        <div className={styles.list}>{pages.map(renderRow)}</div>
      </Accordion>
    </aside>
  )
}
