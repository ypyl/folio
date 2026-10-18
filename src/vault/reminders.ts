// Reminder rules (add-reminders, ADR-0031): a pure parser, renderer, and
// matcher for the vault's app-owned `.folio/reminders.md`. No IO, no DOM — the
// index reads and writes the file, the view derives a day's rows.
//
// A rule is a recurrence, an anchor day, and an ADR-0012 reference to a page.
// Occurrences are derived: `ruleMatches` answers whether a day matches, and
// nothing is ever written except by the user's own action.

import { dayParts } from './dates'
import { findReferenceRanges } from './parse'

export type Recurrence = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export type ReminderRule = {
  recurrence: Recurrence
  /** Anchor day in `YYYY-MM-DD`, a real calendar day. */
  anchor: string
  /** Reminder page name, exactly as referenced. */
  target: string
}

/** The reminders file's fixed header, the pins-file precedent. */
const REMINDERS_HEADER = '# Reminders - order is reminder order'

// One rule line: `- <recurrence> <anchor> <reference>`. The recurrence and the
// day are fixed shapes; the page is an ordinary ADR-0012 reference, so a
// bracketed name with spaces is read by the same scanner the editor uses. The
// list marker is optional so a hand-written line without it still reads.
const RULE_LINE = /^[-*+]?\s*(once|daily|weekly|monthly|yearly)\s+(\d{4}-\d{2}-\d{2})\s+(.+)$/

/** Every rule in the file, in order. A line that is blank, a comment, or does
 *  not carry the rule shape (an unknown recurrence, a day that does not exist,
 *  or no reference) is ignored, the way a malformed pin is. */
export function parseReminders(content: string): ReminderRule[] {
  const rules: ReminderRule[] = []
  for (const raw of content.split('\n')) {
    const line = raw.trim()
    if (line === '' || line.startsWith('#')) continue
    const match = RULE_LINE.exec(line)
    if (!match || dayParts(match[2]) === null) continue
    const ref = findReferenceRanges(match[3]).find((range) => range.kind === 'page')
    if (!ref) continue
    rules.push({ recurrence: match[1] as Recurrence, anchor: match[2], target: ref.target })
  }
  return rules
}

/** The on-disk form: a header, then one `- <recurrence> <anchor> <reference>`
 *  line per rule. An empty list still writes the header, so the file is a
 *  stable, parseable artifact (the pins rule). The bracketed reference form is
 *  written always: it is the one form that holds any name, so a rule never
 *  depends on the page's name staying a single word. */
export function renderReminders(rules: readonly ReminderRule[]): string {
  const body = rules
    .map((rule) => `- ${rule.recurrence} ${rule.anchor} #[[${rule.target}]]`)
    .join('\n')
  return body === '' ? `${REMINDERS_HEADER}\n` : `${REMINDERS_HEADER}\n\n${body}\n`
}

/** Sunday=0 day-of-week for `year-month-day`, by Sakamoto's method: no `Date`,
 *  so no UTC/local or 0-99 year surprises (the same reason `journalDayName`
 *  never parses). */
function weekdayOf(year: number, month: number, day: number): number {
  const offsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
  const y = month < 3 ? year - 1 : year
  return (
    (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + offsets[month - 1] + day) %
    7
  )
}

/** Whether `rule` matches `day`. A date a period does not hold is skipped, not
 *  moved: a `monthly` rule on the 31st simply never equals a short month's day,
 *  and a `yearly` rule on February 29 never equals a common year's. */
export function ruleMatches(rule: ReminderRule, day: string): boolean {
  const anchor = dayParts(rule.anchor)
  const today = dayParts(day)
  if (anchor === null || today === null) return false
  switch (rule.recurrence) {
    case 'once':
      return day === rule.anchor
    case 'daily':
      return day >= rule.anchor
    case 'weekly':
      return (
        day >= rule.anchor &&
        weekdayOf(today.year, today.month, today.day) ===
          weekdayOf(anchor.year, anchor.month, anchor.day)
      )
    case 'monthly':
      return day >= rule.anchor && today.day === anchor.day
    case 'yearly':
      return today.month === anchor.month && today.day === anchor.day
  }
}

/** The rules that match `day`, in file order (add-reminders, the calendar-day
 *  change): what the badge counts and what a due day may materialize. */
export function matchingRules(rules: readonly ReminderRule[], day: string): ReminderRule[] {
  return rules.filter((rule) => ruleMatches(rule, day))
}
