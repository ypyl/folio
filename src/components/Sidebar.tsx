import { Accordion } from './Accordion'
import { JournalCalendar } from './JournalCalendar'
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
  hasVault,
}: {
  pages: Page[]
  journalEntries: Page[]
  activePath: string | null
  onSelect: (path: string) => void
  /** A folder is open and indexed; gates the journal calendar (D6). */
  hasVault: boolean
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
    <aside className={styles.sidebar} aria-label="Notes">
      <Accordion title="Journal" defaultOpen>
        {/* The journal calendar owns the section (journal-calendar D1); it
            stays hidden until a vault is open (no-inert-grid rule). */}
        {hasVault && (
          <JournalCalendar
            journalEntries={journalEntries}
            activePath={activePath}
            onSelect={onSelect}
          />
        )}
      </Accordion>
      <Accordion title="Pages" defaultOpen>
        <div className={styles.list}>{pages.map(renderRow)}</div>
      </Accordion>
    </aside>
  )
}
