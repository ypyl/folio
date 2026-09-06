import { Accordion } from './Accordion'
import type { Page } from '../page'
import styles from './Sidebar.module.css'

// Receives page data via props (design decision 3): components never import
// the vault directly, so the index can swap per folder at App only. Rows are
// keyed and tracked by vault-relative path (design D1/D6), not object
// identity - index pages are re-derived on every refresh.
export function Sidebar({
  pages,
  journalEntries,
  activePath,
  onSelect,
}: {
  pages: Page[]
  journalEntries: Page[]
  activePath: string | null
  onSelect: (path: string) => void
}) {
  const renderRow = (page: Page) => (
    <button
      key={page.path}
      type="button"
      className={styles.row}
      data-active={page.path === activePath || undefined}
      aria-current={page.path === activePath ? 'page' : undefined}
      onClick={() => onSelect(page.path)}
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
