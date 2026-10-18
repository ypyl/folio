// Calendar helpers shared by the journal index, the calendar, and reminders.
// Pure and leaf-level (no imports), so a consumer like `reminders.ts` can use
// them without reaching back into the index.

/** Local 'YYYY-MM-DD' for a Date — built from local year/month/day parts,
 *  never toISOString(), which shifts the day at local midnight boundaries
 *  (journal-calendar D5). */
export function localDayString(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}`
}

/** The zero-padded date-name shape the journal directory and the calendar
 *  agree on. Shape alone is not enough: see `journalDayName`. */
const DATE_NAME = /^(\d{4})-(\d{2})-(\d{2})$/

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/** The date string when `name` is a real calendar day in zero-padded
 *  `YYYY-MM-DD` form, else null (design D1). Checked by component, never by
 *  `Date`: `new Date('2026-09-16')` parses as UTC and `new Date(y, m, d)` maps
 *  years 0-99 to 1900+, so both would answer a different question than "is this
 *  a day the journal calendar can show". A name that is not a real day is not
 *  a journal day and keeps the ordinary page rule. */
export function journalDayName(name: string): string | null {
  const match = DATE_NAME.exec(name)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1) return null
  const length = month === 2 && isLeapYear(year) ? 29 : MONTH_LENGTHS[month - 1]
  return day <= length ? name : null
}

/** A day name split into numbers, or null when it is not a real day. */
export function dayParts(name: string): { year: number; month: number; day: number } | null {
  if (journalDayName(name) === null) return null
  const [year, month, day] = name.split('-').map(Number)
  return { year, month, day }
}

/** The journal day's vault path for a date name (design D1). */
export function journalDayPath(name: string): string {
  return `journals/${name}.md`
}

const JOURNAL_DATE = /^journals\/(\d{4}-\d{2}-\d{2})\.md$/

/** The calendar date ('YYYY-MM-DD') of a journal day path, else null
 *  (journal-calendar D5). Non-date files under `journals/` have no cell. */
export function journalDate(path: string): string | null {
  return JOURNAL_DATE.exec(path)?.[1] ?? null
}
