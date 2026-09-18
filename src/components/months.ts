// Date labels shared by the journal calendar and search's pretty journal-day
// labels (search-notes), plus the label itself (search-results-view). Kept
// out of component files so fast refresh keeps working
// (react(only-export-components)).
import { journalDate, stem } from '../vault/index'

// English labels via the platform formatter: the same strings as the old
// hard-coded month table, without the table.
const MONTH_YEAR = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
const FULL_DATE = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

/** "September 2, 2026" for a local Date. */
export function dayLabel(date: Date): string {
  return FULL_DATE.format(date)
}

/** "September 2026" for a calendar month. */
export function monthYearLabel(year: number, month: number): string {
  return MONTH_YEAR.format(new Date(year, month, 1))
}

/** Pretty label for a journal-day path: "September 2, 2026". Non-date journal
 *  files fall back to the stem. */
function journalLabel(path: string): string {
  const date = journalDate(path)
  if (!date) return stem(path)
  const [y, m, d] = date.split('-').map(Number)
  return dayLabel(new Date(y, m - 1, d))
}

/** Row label for a search result: the pretty journal day, else the title —
 *  which is the page's title for a note and the path inside `assets/` for a file
 *  (search-assets-by-name, design D2), so an asset needs no label rule here. */
export function rowLabel(result: {
  kind: 'page' | 'journal' | 'asset'
  title: string
  path: string
}): string {
  return result.kind === 'journal' ? journalLabel(result.path) : result.title
}
