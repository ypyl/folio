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
  return {
    pages: new Map(pages.map((p) => [p.path, p])),
    byName: new Map(pages.map((p) => [p.title.toLowerCase(), p.path])),
    backlinks: new Map(),
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
    const rows = unreferencedRules(graph, [rule('daily', '2026-10-16', 'Take pills')], '2026-10-16')
    expect(rows).toEqual([rule('daily', '2026-10-16', 'Take pills')])
  })

  it('skips a matching rule whose page the day already references', () => {
    const graph = graphOf([page('journals/2026-10-16.md', ['Take pills'])])
    const rows = unreferencedRules(graph, [rule('daily', '2026-10-16', 'Take pills')], '2026-10-16')
    expect(rows).toEqual([])
  })

  it('skips a rule that does not match the day', () => {
    const graph = graphOf([page('journals/2026-10-16.md')])
    const rows = unreferencedRules(
      graph,
      [rule('weekly', '2026-10-15', 'Review inbox')],
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
    )
    expect(rows).toHaveLength(1)
  })
})
