import { describe, expect, it } from 'vitest'
import { dayReminders } from './rows'
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

describe('dayReminders (add-reminders)', () => {
  it('shows a due rule with nothing referenced as pending', () => {
    const graph = graphOf([page('journals/2026-10-16.md')])
    const rows = dayReminders(graph, [rule('daily', '2026-10-16', 'Take pills')], '2026-10-16')
    expect(rows).toEqual([
      { target: 'Take pills', title: 'Take pills', path: 'pages/Take pills.md', pending: true },
    ])
  })

  it('shows a rule the day already references as recorded', () => {
    const graph = graphOf([
      page('journals/2026-10-16.md', ['Take pills']),
      page('pages/Take pills.md'),
    ])
    const rows = dayReminders(graph, [rule('daily', '2026-10-16', 'Take pills')], '2026-10-16')
    expect(rows).toEqual([
      { target: 'Take pills', title: 'Take pills', path: 'pages/Take pills.md', pending: false },
    ])
  })

  it('records a referenced page even on a day the rule does not match', () => {
    const graph = graphOf([page('journals/2026-10-16.md', ['Review inbox'])])
    const rows = dayReminders(graph, [rule('weekly', '2026-10-15', 'Review inbox')], '2026-10-16')
    expect(rows.map((r) => [r.target, r.pending])).toEqual([['Review inbox', false]])
  })

  it('a rule that neither matches nor is referenced produces no row', () => {
    const graph = graphOf([page('journals/2026-10-16.md')])
    const rows = dayReminders(graph, [rule('weekly', '2026-10-15', 'Review inbox')], '2026-10-16')
    expect(rows).toEqual([])
  })

  it('lists pending rows before recorded rows', () => {
    const graph = graphOf([page('journals/2026-10-16.md', ['Paid'])])
    const rows = dayReminders(
      graph,
      [rule('daily', '2026-10-16', 'Paid'), rule('daily', '2026-10-16', 'Pending one')],
      '2026-10-16',
    )
    expect(rows.map((r) => [r.title, r.pending])).toEqual([
      ['Pending one', true],
      ['Paid', false],
    ])
  })

  it('lists a page once when two rules name it', () => {
    const graph = graphOf([page('journals/2026-10-16.md')])
    const rows = dayReminders(
      graph,
      [rule('daily', '2026-10-16', 'Take pills'), rule('weekly', '2026-10-16', 'Take pills')],
      '2026-10-16',
    )
    expect(rows).toHaveLength(1)
  })

  it('labels a materialized page by its own title', () => {
    const graph = graphOf([page('journals/2026-10-16.md'), page('pages/ana.md')])
    const rows = dayReminders(graph, [rule('daily', '2026-10-16', 'ANA')], '2026-10-16')
    expect(rows[0]).toMatchObject({ target: 'ANA', title: 'ana', path: 'pages/ana.md' })
  })
})
