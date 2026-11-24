import { describe, expect, it, vi } from 'vitest'
import { agentActions, MAX_READ_CHARS, type AgentDeps } from './actions'
import type { Graph, IndexPage } from '../vault/index'
import { DraftStore } from '../editor/drafts'
import type { ReminderRule } from '../vault/reminders'
import type { SearchResult } from '../search/core'

/** A page as the index holds it. Only the fields the actions read are real. */
function page(path: string, title: string, content: string): IndexPage {
  return {
    path,
    title,
    content,
    kind: path.startsWith('journals/') ? 'journal' : 'page',
    links: [],
    assets: [],
    boards: [],
    lastModified: 0,
  }
}

function graphOf(...pages: IndexPage[]): Graph {
  return {
    pages: new Map(pages.map((one) => [one.path, one])),
    byName: new Map(pages.map((one) => [one.title.toLowerCase(), one.path])),
    backlinks: new Map(),
    files: new Set(pages.map((one) => one.path)),
    assets: [],
    boards: [],
    boardsByName: new Map(),
    boardReferrers: new Map(),
  }
}

type Overrides = Partial<AgentDeps> & { files?: Record<string, string> }

/** The collaborators a tool call reads, with the app's write-through seams
 *  replaced by recorders: what they are handed is what the tool wrote. */
function deps(overrides: Overrides = {}) {
  const { files = {}, ...rest } = overrides
  // A file the fake storage holds is a file the fake index lists, as the scan
  // would: the actions read the index to tell "no file" from "unreadable".
  const indexed = rest.graph ?? graphOf()
  const withFiles = { ...indexed, files: new Set([...indexed.files, ...Object.keys(files)]) }
  const writes: { path: string; content: string }[] = []
  const reminderWrites: ReminderRule[][] = []
  const records: { tool: string; path: string; added: number; removed: number }[] = []
  const opens: string[] = []
  const base: AgentDeps = {
    graph: withFiles,
    storage: {
      read: async (path: string) => {
        if (!(path in files)) throw new Error(`no file ${path}`)
        return files[path]
      },
    },
    drafts: new DraftStore(),
    openPath: null,
    folder: 'notes',
    today: '2026-09-15',
    remindersDue: 0,
    reminders: [],
    replaceOpen: vi.fn(() => true),
    appendOpen: vi.fn(),
    open: (path: string) => opens.push(path),
    savePage: async (path, content) => {
      writes.push({ path, content })
      return true
    },
    saveReminders: async (rules) => {
      reminderWrites.push([...rules])
      return true
    },
    search: () => [],
    backlinks: () => [],
    forwardlinks: () => [],
    record: (tool, path, added, removed) => records.push({ tool, path, added, removed }),
    ...rest,
  }
  return { deps: base, writes, reminderWrites, records, opens }
}

describe('the agent actions: names resolve by the app rule (agent-tools)', () => {
  it('resolves a calendar date to its journal day', async () => {
    const { deps: d, writes } = deps()
    const result = await agentActions(d).append({ name: '2026-09-15', text: 'Shopping' })
    expect(result).toMatchObject({ ok: true, path: 'journals/2026-09-15.md' })
    expect(writes[0].path).toBe('journals/2026-09-15.md')
  })

  it('resolves any other name to its page', async () => {
    const { deps: d, writes } = deps()
    const result = await agentActions(d).create({ name: 'Ideas', text: 'Half-formed.' })
    expect(result).toMatchObject({ ok: true, path: 'pages/Ideas.md', name: 'Ideas' })
    expect(writes[0]).toEqual({ path: 'pages/Ideas.md', content: 'Half-formed.\n\n' })
  })

  it('reads an existing page by name, using the indexed path', async () => {
    const existing = page('pages/garden.md', 'Garden', 'Tomatoes.\n')
    const { deps: d } = deps({
      graph: graphOf(existing),
      files: { 'pages/garden.md': 'Tomatoes.\n' },
    })
    const result = await agentActions(d).read({ name: 'GARDEN' })
    expect(result).toMatchObject({ ok: true, path: 'pages/garden.md', name: 'Garden' })
  })

  it('refuses a name that is a path, and app-owned state', async () => {
    const { deps: d } = deps()
    expect(await agentActions(d).read({ name: 'pages/Ideas.md' })).toMatchObject({
      ok: false,
      error: 'invalid',
    })
    expect(
      await agentActions(d).edit({ name: '.folio/pins.md', old_string: 'a', new_string: 'b' }),
    ).toMatchObject({ ok: false, error: 'refused-path' })
    expect(
      await agentActions(d).edit({ name: '.folio', old_string: 'a', new_string: 'b' }),
    ).toMatchObject({ ok: false, error: 'refused-path' })
  })
})

describe('the agent actions: reads are capped (agent-tools)', () => {
  it('returns a line window and says how much of the page there is', async () => {
    const content = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join('\n')
    const { deps: d } = deps({ files: { 'pages/Big.md': content } })
    const first = await agentActions(d).read({ name: 'Big', from_line: 5, lines: 3 })
    expect(first).toMatchObject({ ok: true, text: 'line 5\nline 6\nline 7', total_lines: 20 })
    expect(first).toMatchObject({ from_line: 5, truncated: true })
  })

  it('clips a window past the character cap', async () => {
    const content = 'x'.repeat(MAX_READ_CHARS + 500)
    const { deps: d } = deps({ files: { 'pages/Long.md': content } })
    const result = await agentActions(d).read({ name: 'Long' })
    expect(result).toMatchObject({ ok: true, truncated: true })
    expect((result as { text: string }).text.length).toBe(MAX_READ_CHARS)
  })

  it('reads a page with no file as empty rather than failing', async () => {
    const { deps: d } = deps()
    expect(await agentActions(d).read({ name: 'Never written' })).toMatchObject({
      ok: true,
      text: '',
      total_lines: 1,
      truncated: false,
    })
  })
})

describe('the agent actions: the two write shapes (agent-tools)', () => {
  it('edits a closed page by writing through the app path', async () => {
    const {
      deps: d,
      writes,
      records,
    } = deps({
      files: { 'pages/Ideas.md': 'one\ntwo\nthree\n\n' },
    })
    const result = await agentActions(d).edit({
      name: 'Ideas',
      old_string: 'two',
      new_string: 'two and a half',
    })
    expect(result).toMatchObject({ ok: true, path: 'pages/Ideas.md', added: 1, removed: 1 })
    expect(writes[0].content).toBe('one\ntwo and a half\nthree\n\n')
    expect(records[0]).toEqual({ tool: 'edit_note', path: 'pages/Ideas.md', added: 1, removed: 1 })
  })

  it('edits the open page as one transaction and writes no file', async () => {
    const replaceOpen = vi.fn(() => true)
    const drafts = new DraftStore()
    drafts.open('pages/Ideas.md', 'saved text\n\n')
    drafts.edit('pages/Ideas.md', 'saved text plus what the user typed\n\n')
    const { deps: d, writes } = deps({
      graph: graphOf(page('pages/Ideas.md', 'Ideas', 'saved text\n\n')),
      drafts,
      openPath: 'pages/Ideas.md',
      replaceOpen,
      files: { 'pages/Ideas.md': 'saved text\n\n' },
    })
    const result = await agentActions(d).edit({
      name: 'Ideas',
      old_string: 'what the user typed',
      new_string: 'the user’s typing',
    })
    expect(result.ok).toBe(true)
    // Matched against the draft the user is typing in, applied through the
    // editor, and never written: the debounced saver owns that.
    expect(replaceOpen).toHaveBeenCalledWith('what the user typed', 'the user’s typing')
    expect(writes).toHaveLength(0)
  })

  it('fails a stale match and writes nothing', async () => {
    const { deps: d, writes, records } = deps({ files: { 'pages/Ideas.md': 'now different\n' } })
    expect(
      await agentActions(d).edit({ name: 'Ideas', old_string: 'the old text', new_string: 'x' }),
    ).toMatchObject({ ok: false, error: 'not-found' })
    expect(writes).toHaveLength(0)
    expect(records).toHaveLength(0)
  })

  it('refuses a match that occurs twice', async () => {
    const { deps: d, writes } = deps({ files: { 'pages/Ideas.md': 'todo\ntodo\n' } })
    expect(
      await agentActions(d).edit({ name: 'Ideas', old_string: 'todo', new_string: 'x' }),
    ).toMatchObject({ ok: false, error: 'ambiguous' })
    expect(writes).toHaveLength(0)
  })

  it('appends to the open page through the editor, and to a closed one through the file', async () => {
    const appendOpen = vi.fn()
    const drafts = new DraftStore()
    drafts.open('pages/Ideas.md', 'open\n\n')
    const { deps: d, writes } = deps({
      drafts,
      openPath: 'pages/Ideas.md',
      appendOpen,
      files: { 'pages/Ideas.md': 'open\n\n', 'pages/Other.md': 'other\n\n' },
    })
    const open = await agentActions(d).append({ name: 'Ideas', text: 'Added.' })
    expect(open.ok).toBe(true)
    expect(appendOpen).toHaveBeenCalledWith('Added.')
    expect(writes).toHaveLength(0)

    const closed = await agentActions(d).append({ name: 'Other', text: 'Added.' })
    expect(closed.ok).toBe(true)
    expect(writes[0]).toEqual({ path: 'pages/Other.md', content: 'other\n\nAdded.\n\n' })
  })

  it('refuses to create a page that already has text', async () => {
    const { deps: d, writes } = deps({ files: { 'pages/Ideas.md': 'here\n' } })
    expect(await agentActions(d).create({ name: 'Ideas', text: 'new' })).toMatchObject({
      ok: false,
      error: 'exists',
    })
    expect(writes).toHaveLength(0)
  })

  it('creates the open page through the editor, not the file', async () => {
    // The page is open from a reference and holds no text: a draft exists, but
    // the folder has no file, so a create is allowed — and it goes into the
    // document, because the pane's own save is what writes the file (design D3).
    const drafts = new DraftStore()
    const openPath = 'pages/Ideas.md'
    drafts.open(openPath, '')
    const appendOpen = vi.fn()
    const { deps: d, writes, records } = deps({ drafts, openPath, appendOpen })
    const result = await agentActions(d).create({ name: 'Ideas', text: 'Half-formed.' })
    expect(result).toMatchObject({ ok: true, path: openPath, added: 3 })
    expect(appendOpen).toHaveBeenCalledWith('Half-formed.')
    expect(writes).toHaveLength(0)
    expect(records[0]).toEqual({ tool: 'create_note', path: openPath, added: 3, removed: 0 })
  })

  it('still refuses an open page that has unsaved text in it', async () => {
    const drafts = new DraftStore()
    const openPath = 'pages/Ideas.md'
    drafts.open(openPath, '')
    drafts.edit(openPath, 'typed a moment ago')
    const { deps: d, writes } = deps({ drafts, openPath })
    expect(await agentActions(d).create({ name: 'Ideas', text: 'new' })).toMatchObject({
      ok: false,
      error: 'exists',
    })
    expect(writes).toHaveLength(0)
  })
})

describe('the agent actions: reminders go through the app writer (agent-tools)', () => {
  it('adds a rule and leaves the earlier ones in order', async () => {
    const rules: ReminderRule[] = [
      { recurrence: 'weekly', anchor: '2026-09-01', target: 'Weekly Review' },
    ]
    const { deps: d, reminderWrites } = deps({ reminders: rules })
    const result = await agentActions(d).remind({
      name: 'Inbox',
      recurrence: 'daily',
      anchor: '2026-09-15',
    })
    expect(result).toMatchObject({ ok: true, path: '.folio/reminders.md' })
    expect(reminderWrites[0]).toEqual([
      { recurrence: 'weekly', anchor: '2026-09-01', target: 'Weekly Review' },
      { recurrence: 'daily', anchor: '2026-09-15', target: 'Inbox' },
    ])
  })

  it('replaces an existing rule for the same page', async () => {
    const rules: ReminderRule[] = [{ recurrence: 'daily', anchor: '2026-09-01', target: 'Inbox' }]
    const { deps: d, reminderWrites } = deps({
      reminders: rules,
      graph: graphOf(page('pages/Inbox.md', 'Inbox', '')),
    })
    await agentActions(d).remind({ name: 'inbox', recurrence: 'weekly', anchor: '2026-09-15' })
    expect(reminderWrites[0]).toEqual([
      { recurrence: 'weekly', anchor: '2026-09-15', target: 'Inbox' },
    ])
  })

  it('refuses an unknown recurrence and an impossible day', async () => {
    const { deps: d, reminderWrites } = deps()
    expect(
      await agentActions(d).remind({ name: 'Inbox', recurrence: 'hourly', anchor: '2026-09-15' }),
    ).toMatchObject({ ok: false, error: 'invalid' })
    expect(
      await agentActions(d).remind({ name: 'Inbox', recurrence: 'daily', anchor: '2026-02-30' }),
    ).toMatchObject({ ok: false, error: 'invalid' })
    expect(reminderWrites).toHaveLength(0)
  })
})

describe('the agent actions: search, links, state, open (agent-tools)', () => {
  it('caps search rows and names each one', () => {
    const results = Array.from({ length: 30 }, (_, i) => ({
      path: `pages/Note ${i}.md`,
      title: `Note ${i}`,
      kind: 'page' as const,
      text: '',
      blocks: [],
      ranges: [],
      matchedTitle: false,
    })) as unknown as SearchResult[]
    const { deps: d } = deps({ search: () => results })
    const result = agentActions(d).search({ query: 'note' })
    expect(result.ok).toBe(true)
    expect((result as { results: unknown[] }).results).toHaveLength(10)
    expect((result as { results: { name: string }[] }).results[0].name).toBe('Note 0')
  })

  it('says what the app is looking at', () => {
    const { deps: d } = deps({ openPath: 'pages/Ideas.md', remindersDue: 2 })
    expect(agentActions(d).state()).toEqual({
      ok: true,
      folder: 'notes',
      open_page: 'pages/Ideas.md',
      today: '2026-09-15',
      reminders_due: 2,
    })
  })

  it('opens a page through the app navigation', () => {
    const { deps: d, opens } = deps()
    expect(agentActions(d).open({ name: 'Ideas' })).toMatchObject({ ok: true })
    expect(opens).toEqual(['pages/Ideas.md'])
  })
})
