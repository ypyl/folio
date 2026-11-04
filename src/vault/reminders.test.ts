import { describe, expect, it } from 'vitest'
import {
  doneTargets,
  dueRules,
  matchingRules,
  parseReminders,
  renderReminders,
  ruleIsDue,
  ruleMatches,
  type RecordedElsewhere,
  type ReminderRule,
  type Recurrence,
} from './reminders'

function rule(recurrence: Recurrence, anchor: string, target = 'Take pills'): ReminderRule {
  return { recurrence, anchor, target }
}

describe('parseReminders (add-reminders)', () => {
  it('reads every recurrence and both reference forms', () => {
    const rules = parseReminders(
      [
        '# Reminders - order is reminder order',
        '',
        '- once 2027-03-15 #[[Renew passport]]',
        '- daily 2026-10-16 #Take',
        '- weekly 2026-10-16 #[[Review inbox]]',
        '- monthly 2026-10-01 #[[Pay rent]]',
        '- yearly 1990-04-12 #[[Ana birthday]]',
      ].join('\n'),
    )
    expect(rules).toEqual([
      { recurrence: 'once', anchor: '2027-03-15', target: 'Renew passport' },
      { recurrence: 'daily', anchor: '2026-10-16', target: 'Take' },
      { recurrence: 'weekly', anchor: '2026-10-16', target: 'Review inbox' },
      { recurrence: 'monthly', anchor: '2026-10-01', target: 'Pay rent' },
      { recurrence: 'yearly', anchor: '1990-04-12', target: 'Ana birthday' },
    ])
  })

  it('accepts a line without a list marker', () => {
    expect(parseReminders('yearly 1990-04-12 #[[Ana]]')).toEqual([
      { recurrence: 'yearly', anchor: '1990-04-12', target: 'Ana' },
    ])
  })

  it('ignores a malformed line and keeps the rest', () => {
    const rules = parseReminders(
      [
        '- hourly 2026-01-01 #[[x]]', // unknown recurrence
        '- daily 2026-13-45 #[[x]]', // not a real day
        '- daily 2026-01-01 just words', // no reference
        '- daily 2026-01-01 #[[Good]]',
      ].join('\n'),
    )
    expect(rules).toEqual([{ recurrence: 'daily', anchor: '2026-01-01', target: 'Good' }])
  })
})

describe('renderReminders (add-reminders)', () => {
  it('writes the header and one bracketed rule per line', () => {
    expect(renderReminders([rule('daily', '2026-10-16', 'Take pills')])).toBe(
      '# Reminders - order is reminder order\n\n- daily 2026-10-16 #[[Take pills]]\n',
    )
  })

  it('writes a readable header when there are no rules', () => {
    expect(renderReminders([])).toBe('# Reminders - order is reminder order\n')
  })

  it('round-trips through the parser', () => {
    const rules = [
      rule('once', '2027-03-15', 'Renew passport'),
      rule('yearly', '1990-04-12', "Ana's birthday"),
      rule('weekly', '2026-10-16', 'Review inbox'),
    ]
    expect(parseReminders(renderReminders(rules))).toEqual(rules)
  })
})

describe('ruleMatches (add-reminders)', () => {
  it('once matches only its anchor day', () => {
    const r = rule('once', '2026-01-01')
    expect(ruleMatches(r, '2026-01-01')).toBe(true)
    expect(ruleMatches(r, '2026-01-02')).toBe(false)
    expect(ruleMatches(r, '2025-12-31')).toBe(false)
  })

  it('daily matches the anchor and every later day, not earlier', () => {
    const r = rule('daily', '2026-01-01')
    expect(ruleMatches(r, '2026-01-01')).toBe(true)
    expect(ruleMatches(r, '2026-03-04')).toBe(true)
    expect(ruleMatches(r, '2025-12-31')).toBe(false)
  })

  it('weekly matches one weekday from the anchor', () => {
    // 2026-01-01 is a Thursday.
    const r = rule('weekly', '2026-01-01')
    expect(ruleMatches(r, '2026-01-08')).toBe(true)
    expect(ruleMatches(r, '2026-01-09')).toBe(false)
    expect(ruleMatches(r, '2025-12-25')).toBe(false) // earlier Thursday
  })

  it('monthly matches one day-of-month from the anchor', () => {
    const r = rule('monthly', '2026-01-01')
    expect(ruleMatches(r, '2026-02-01')).toBe(true)
    expect(ruleMatches(r, '2026-02-02')).toBe(false)
  })

  it('yearly matches one month-day, in any later year', () => {
    const r = rule('yearly', '1990-04-12')
    expect(ruleMatches(r, '2026-04-12')).toBe(true)
    expect(ruleMatches(r, '2026-04-13')).toBe(false)
  })

  it('yearly does not match before its anchor', () => {
    const r = rule('yearly', '2027-03-15')
    expect(ruleMatches(r, '2026-03-15')).toBe(false)
    expect(ruleMatches(r, '2027-03-15')).toBe(true)
    expect(ruleMatches(r, '2028-03-15')).toBe(true)
  })

  it('skips the 31st in a short month', () => {
    const r = rule('monthly', '2026-01-31')
    expect(ruleMatches(r, '2026-03-31')).toBe(true)
    expect(ruleMatches(r, '2026-04-30')).toBe(false)
    expect(ruleMatches(r, '2026-02-28')).toBe(false)
  })

  it('skips February 29 in a common year', () => {
    const r = rule('yearly', '2024-02-29')
    expect(ruleMatches(r, '2028-02-29')).toBe(true)
    expect(ruleMatches(r, '2026-02-28')).toBe(false)
  })
})

describe('matchingRules (add-reminders)', () => {
  it('keeps only the rules that match the day', () => {
    const rules = [
      rule('daily', '2026-10-16', 'Take pills'),
      rule('weekly', '2026-10-15', 'Review inbox'),
    ]
    expect(matchingRules(rules, '2026-10-16').map((r) => r.target)).toEqual(['Take pills'])
  })
})

describe('dueRules (carry-and-retire-a-once-reminder)', () => {
  const unrecorded: RecordedElsewhere = () => false
  const recorded: RecordedElsewhere = () => true

  it('matches a rule that matches the day', () => {
    const rules = [rule('daily', '2026-10-20')]
    expect(dueRules(rules, '2026-10-23', '2026-10-23', recorded)).toEqual(rules)
  })

  it('carries an unrecorded one-off whose day passed onto today', () => {
    const rules = [rule('once', '2026-10-20', 'Renew passport')]
    expect(dueRules(rules, '2026-10-23', '2026-10-23', unrecorded)).toEqual(rules)
  })

  it('does not carry a one-off the vault already records', () => {
    const rules = [rule('once', '2026-10-20', 'Renew passport')]
    expect(dueRules(rules, '2026-10-23', '2026-10-23', recorded)).toEqual([])
  })

  it('carries only into today', () => {
    const rules = [rule('once', '2026-10-20', 'Renew passport')]
    expect(dueRules(rules, '2026-10-22', '2026-10-23', unrecorded)).toEqual([])
    expect(dueRules(rules, '2026-10-24', '2026-10-23', unrecorded)).toEqual([])
  })

  it('does not carry a one-off whose day has not come', () => {
    const rules = [rule('once', '2026-11-02', 'Renew passport')]
    expect(dueRules(rules, '2026-10-23', '2026-10-23', unrecorded)).toEqual([])
  })

  it('carries no other recurrence', () => {
    // 2026-10-22 is a Thursday, so a weekly rule anchored there does not match
    // Friday the 23rd; a monthly rule anchored on the 22nd does not either.
    expect(
      dueRules([rule('weekly', '2026-10-22')], '2026-10-23', '2026-10-23', unrecorded),
    ).toEqual([])
    expect(
      dueRules([rule('monthly', '2026-09-22')], '2026-10-23', '2026-10-23', unrecorded),
    ).toEqual([])
  })

  it('asks the vault about the day being judged', () => {
    const asked: Array<[string, string]> = []
    const spy: RecordedElsewhere = (r, day) => {
      asked.push([r.target, day])
      return false
    }
    ruleIsDue(rule('once', '2026-10-20', 'Renew passport'), '2026-10-23', '2026-10-23', spy)
    expect(asked).toEqual([['Renew passport', '2026-10-23']])
  })
})

describe('doneTargets (hide-a-ticked-reminder-from-the-badge)', () => {
  it('reads the page names of done task items, lowercased', () => {
    const content = [
      '- [x] #[[Take pills]]',
      '- [X] #[[Water the plants]]',
      '* [x] nested under something',
      '- [ ] #Untouched',
      '#[[Bare reference]]',
      'prose with [x] and #[[NotDone]]',
      '- [x]no space #[[NotATask]]',
      '1. [x] #[[Numbered]]',
      '    - [x] #[[Indented]]',
    ].join('\n')
    const done = doneTargets(content)
    expect([...done].sort()).toEqual(
      ['indented', 'numbered', 'take pills', 'water the plants'].sort(),
    )
  })

  it('ignores a done item with no reference, and a repeated one collapses', () => {
    expect([...doneTargets('- [x] something else')]).toEqual([])
    expect([...doneTargets('- [x] #[[A]]\n- [x] #[[a]]')]).toEqual(['a'])
  })
})
