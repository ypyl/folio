// Month names shared by the journal calendar and search's pretty journal-day
// labels (search-notes), plus the label itself (search-results-view). Kept
// out of component files so fast refresh keeps working
// (react(only-export-components)).
import { journalDate } from '../vault/index'

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Pretty label for a journal-day path: "September 2, 2026" via the
 *  calendar's month names. Non-date journal files fall back to the stem. */
export function journalLabel(path: string): string {
  const date = journalDate(path)
  if (!date) return path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, '')
  const [y, m, d] = date.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}