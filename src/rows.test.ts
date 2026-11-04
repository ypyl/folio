import { describe, expect, it } from 'vitest'
import { unreferencedRules } from './rows'
import type { Graph, IndexPage } from './vault/index'
import type { ReminderRule } from './vault/reminders'

function page(path: string, references: string[] = []): IndexPage {
  const title = path.slice(path.lastIndexOf('/') + 1, -3)
  return {
    path,
    title,
    kind: path.startsWith('journals/') ? 'journal' : 'page',
    content: '',
    links: references.map((target) => ({ target, via: 'bracketed' as const })),
    assets: [],
    boards: [],
    lastModified: 0,
  }
}

function graphOf(pages: IndexPage[]): Graph {
  // Backlinks exactly as the index folds them, so a test can spell "another
  // journal day records this page" with a page's links.
  const byName = new Map(pages.map((p) => [p.title.toLowerCase(), p.path]))
  const backlinks = new Map<string, string[]>()
  for (const p of pages) {
    for (const link of p.links) {
      const target = link.target.toLowerCase()
      const list = backlinks.get(target)
      if (list) list.push(p.path)
      else backlinks.set(target, [p.path])
    }
  }
  return {
    pages: new Map(pages.map((p) => [p.path, p])),
    byName,
    backlinks,
    files: new Set(pages.map((p) => p.path)),
    assets: [],
    boards: [],
    boardsByName: new Map(),
    boardReferrers: new Map(),
  }
}

function rule(
  recurrence: ReminderRule['recurrence'],
  anchor: string,
  target: string,
): ReminderRule {
  return { recurrence, anchor, target }
}

describe('unreferencedRules (add-reminders)', () => {
  it('returns a matching rule whose page the day does not reference', () => {
    const graph = graphOf([page('journals/2026-10-16.md')])
    const rows = unreferencedRules(
      graph,
      [rule('daily', '2026-10-16', 'Take pills')],
      '2026-10-16',
      '2026-10-16',
    )
    expect(rows).toEqual([rule('daily', '2026-10-16', 'Take pills')])
  })

  it('skips a matching rule whose page the day already references', () => {
    const graph = graphOf([page('journals/2026-10-16.md', ['Take pills'])])
    const rows = unreferencedRules(
      graph,
      [rule('daily', '2026-10-16', 'Take pills')],
      '2026-10-16',
      '2026-10-16',
    )
    expect(rows).toEqual([])
  })

  it('skips a rule that does not match the day', () => {
    const graph = graphOf([page('journals/2026-10-16.md')])
    const rows = unreferencedRules(
      graph,
      [rule('weekly', '2026-10-15', 'Review inbox')],
      '2026-10-16',
      '2026-10-16',
    )
    expect(rows).toEqual([])
  })

  it('lists a page once when two rules name it', () => {
    const graph = graphOf([page('journals/2026-10-16.md')])
    const rows = unreferencedRules(
      graph,
      [rule('daily', '2026-10-16', 'Take pills'), rule('weekly', '2026-10-16', 'Take pills')],
      '2026-10-16',
      '2026-10-16',
    )
    expect(rows).toHaveLength(1)
  })

  it('counts a line the open draft holds but the saved note does not', () => {
    const graph = graphOf([page('journals/2026-10-16.md')])
    const rows = unreferencedRules(
      graph,
      [rule('daily', '2026-10-16', 'Take pills')],
      '2026-10-16',
      '2026-10-16',
      '\n\n#[[Take pills]]',
    )
    expect(rows).toEqual([])
  })
})

describe('unreferencedRules (carry-and-retire-a-once-reminder)', () => {
  it('carries a missed one-off into today', () => {
    const graph = graphOf([page('journals/2026-10-23.md')])
    const rows = unreferencedRules(
      graph,
      [rule('once', '2026-10-20', 'Renew passport')],
      '2026-10-23',
      '2026-10-23',
    )
    expect(rows).toEqual([rule('once', '2026-10-20', 'Renew passport')])
  })

  it('does not carry a one-off another journal day records', () => {
    const graph = graphOf([
      page('journals/2026-10-21.md', ['Renew passport']),
      page('journals/2026-10-23.md'),
    ])
    const rows = unreferencedRules(
      graph,
      [rule('once', '2026-10-20', 'Renew passport')],
      '2026-10-23',
      '2026-10-23',
    )
    expect(rows).toEqual([])
  })

  it('ignores a recording before the anchor day', () => {
    const graph = graphOf([
      page('journals/2026-10-01.md', ['Renew passport']),
      page('journals/2026-10-23.md'),
    ])
    const rows = unreferencedRules(
      graph,
      [rule('once', '2026-10-20', 'Renew passport')],
      '2026-10-23',
      '2026-10-23',
    )
    expect(rows).toEqual([rule('once', '2026-10-20', 'Renew passport')])
  })

  it('does not carry into a day that is not today', () => {
    const graph = graphOf([page('journals/2026-10-22.md')])
    const rows = unreferencedRules(
      graph,
      [rule('once', '2026-10-20', 'Renew passport')],
      '2026-10-22',
      '2026-10-23',
    )
    expect(rows).toEqual([])
  })

  it('does not carry a one-off anchored after today', () => {
    const graph = graphOf([page('journals/2026-10-23.md')])
    const rows = unreferencedRules(
      graph,
      [rule('once', '2026-11-02', 'Renew passport')],
      '2026-10-23',
      '2026-10-23',
    )
    expect(rows).toEqual([])
  })

  it('carries a missed one-off once: the day already holding the line gets none', () => {
    const graph = graphOf([page('journals/2026-10-23.md', ['Renew passport'])])
    const rows = unreferencedRules(
      graph,
      [rule('once', '2026-10-20', 'Renew passport')],
      '2026-10-23',
      '2026-10-23',
    )
    expect(rows).toEqual([])
  })
})
