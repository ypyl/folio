import { describe, expect, it } from 'vitest'
import { buildIndex, journalDayName, resolveBoardPath } from '../vault/index'
import { parseLinks } from '../vault/parse'
import { matchingRules } from '../vault/reminders'
import { createDemoVault, DEMO_WELCOME_PATH } from './content'

const TODAY = '2026-09-15'

/** The pages the Welcome page's table of contents names, in order. */
const GUIDE_PAGES = [
  'pages/References.md',
  'pages/Links and backlinks.md',
  'pages/Contents.md',
  'pages/Journal.md',
  'pages/Reminders.md',
  'pages/Boards.md',
  'pages/Assets.md',
  'pages/Search.md',
  'pages/Editing and tasks.md',
  'pages/Presenting.md',
]

async function demoIndex() {
  return buildIndex(createDemoVault(TODAY))
}

describe('the guided demo seed', () => {
  it('holds every content kind under the vault folders', async () => {
    const index = await demoIndex()
    expect(index.graph.pages.has(DEMO_WELCOME_PATH)).toBe(true)
    expect(index.graph.boards).toEqual(['boards/How Folio works.excalidraw'])
    expect(index.graph.assets).toEqual(['assets/folio-flow.svg', 'assets/reading-list.txt'])
    expect([...index.graph.pages.values()].filter((p) => p.kind === 'journal')).toHaveLength(3)
    expect(index.pins).toEqual([DEMO_WELCOME_PATH, 'pages/Reminders.md'])
    expect(index.reminders).toEqual([
      { recurrence: 'daily', anchor: TODAY, target: 'Water the plants' },
      { recurrence: 'weekly', anchor: TODAY, target: 'Weekly review' },
    ])
  })

  it('makes the Welcome page a table of contents for every guide page', async () => {
    const index = await demoIndex()
    const welcome = index.graph.pages.get(DEMO_WELCOME_PATH)!
    const targets = new Set(parseLinks(welcome.content).map((link) => link.target.toLowerCase()))
    for (const path of GUIDE_PAGES) {
      const guide = index.graph.pages.get(path)!
      expect(targets.has(guide.title.toLowerCase())).toBe(true)
    }
  })

  it('gives every guide page a reference back to Welcome', async () => {
    const index = await demoIndex()
    for (const path of GUIDE_PAGES) {
      const guide = index.graph.pages.get(path)!
      expect(guide.links.map((link) => link.target.toLowerCase())).toContain('welcome')
    }
  })

  it('resolves every page reference except the one the guide names as missing', async () => {
    const index = await demoIndex()
    const missing: string[] = []
    for (const page of index.graph.pages.values()) {
      for (const link of page.links) {
        if (link.target.toLowerCase() === 'missing-topic') continue
        if (
          !index.graph.byName.has(link.target.toLowerCase()) &&
          journalDayName(link.target) === null
        ) {
          missing.push(`${page.path} -> ${link.target}`)
        }
      }
    }
    expect(missing).toEqual([])
    // The deliberately missing name is still exercised by the guide.
    expect(index.graph.pages.get('pages/References.md')!.links.map((l) => l.target)).toContain(
      'missing-topic',
    )
  })

  it('resolves every board reference to the demo board', async () => {
    const index = await demoIndex()
    const refs = [...index.graph.pages.values()].flatMap((page) => page.boards)
    expect(refs.length).toBeGreaterThan(0)
    for (const ref of refs) {
      expect(resolveBoardPath(ref.target, index.graph.boardsByName)).toBe(
        'boards/How Folio works.excalidraw',
      )
    }
  })

  it('matches the demo reminders on today', async () => {
    const index = await demoIndex()
    expect(matchingRules(index.reminders, TODAY).map((rule) => rule.target)).toEqual([
      'Water the plants',
      'Weekly review',
    ])
    expect(matchingRules(index.reminders, '2026-09-16').map((rule) => rule.target)).toEqual([
      'Water the plants',
    ])
  })

  it('leaves Standalone with no backlinks', async () => {
    const index = await demoIndex()
    expect(index.graph.backlinks.get('standalone')).toBeUndefined()
  })

  it('names today in the guide and seeds today with a note', async () => {
    const index = await demoIndex()
    expect(index.graph.pages.has(`journals/${TODAY}.md`)).toBe(true)
    expect(index.graph.pages.get('pages/Journal.md')!.content).toContain(`#[[${TODAY}]]`)
  })
})
