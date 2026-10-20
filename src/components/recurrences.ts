import type { Recurrence } from '../vault/reminders'
import { dayLabel } from './months'

/**
 * The visible names of the five recurrences (confirm-replacing-a-reminder). One
 * map, because the day menu's items and the replacement confirmation must name a
 * recurrence the same way; the confirmation cannot describe a label the menu no
 * longer shows.
 */
export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  once: 'Once, on this day',
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
  yearly: 'Every year',
}

/** The recurrences in the order the day menu offers them. */
export const RECURRENCES: readonly Recurrence[] = ['once', 'daily', 'weekly', 'monthly', 'yearly']

/** A rule's schedule in the menu's own words: "every day from October 6, 2026",
 *  or "once, on October 20, 2026" for the one-off. The replacement confirmation
 *  names the rule it would delete with this, so the two surfaces agree. */
export function describeSchedule(rule: { recurrence: Recurrence; anchor: string }): string {
  const [year, month, day] = rule.anchor.split('-').map(Number)
  const label = dayLabel(new Date(year, month - 1, day))
  return rule.recurrence === 'once'
    ? `once, on ${label}`
    : `${RECURRENCE_LABELS[rule.recurrence].toLowerCase()} from ${label}`
}
