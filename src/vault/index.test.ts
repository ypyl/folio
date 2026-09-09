import { describe, expect, it } from 'vitest'
import { FakeFileHandle, buildTree, type FakeDirectoryHandle } from './fakeHandle'
import { FileSystemVaultStorage } from './fs'
import {
  buildIndex,
  isPagePath,
  journalDate,
  orderPages,
  parsePins,
  refreshIndex,
  upsertPage,
  upsertPins,
  type IndexPage,
} from './index'

function vault(tree: FakeDirectoryHandle): FileSystemVaultStorage {
  return new FileSystemVaultStorage(tree as unknown as FileSystemDirectoryHandle)
}

describe('isPagePath (scan scope, design D4)', () => {
  it('accepts lowercase and upper-case .md files', () => {
    expect(isPagePath('a.md')).toBe(true)
    expect(isPagePath('dir/NOTES.MD')).toBe(true)
  })

  it('rejects non-markdown files', () => {
    expect(isPagePath('image.png')).toBe(false)
    expect(isPagePath('notes.txt')).toBe(false)
    expect(isPagePath('README')).toBe(false)
  })

  it('rejects hidden paths at any depth', () => {
    expect(isPagePath('.hidden.md')).toBe(false)
    expect(isPagePath('.obsidian/plugins/x.md')).toBe(false)
    expect(isPagePath('dir/.spot.md')).toBe(false)
  })

  it('rejects the assets folder at any case', () => {
    expect(isPagePath('assets/notes.md')).toBe(false)
    expect(isPagePath('Assets/notes.md')).toBe(false)
    expect(isPagePath('assets/nested/x.md')).toBe(false)
  })

  it('a page named assets at root still scans', () => {
    expect(isPagePath('assets.md')).toBe(true)
  })
})

describe('buildIndex', () => {
  it('indexes every markdown page with path, title, kind, and content', async () => {
    const tree = buildTree({
      'Welcome.md': '# Welcome',
      projects: { 'ideas.md': 'an idea' },
      'NOTES.MD': 'upper',
      'draft.v2.md': 'multi-dot',
      journals: { '2026-09-02.md': 'daily' },
      'journals.md': 'not a journal',
      'image.png': 'png',
      '.obsidian': { plugins: { 'x.md': 'hidden' } },
    })
    const index = await buildIndex(vault(tree))

    expect([...index.graph.pages.keys()]).toEqual([
      'NOTES.MD',
      'Welcome.md',
      'draft.v2.md',
      'journals.md',
      'journals/2026-09-02.md',
      'projects/ideas.md',
    ])
    expect(index.graph.pages.get('draft.v2.md')!.title).toBe('draft.v2')
    expect(index.graph.pages.get('NOTES.MD')!.title).toBe('NOTES')
    expect(index.graph.pages.get('projects/ideas.md')!.content).toBe('an idea')
    expect(index.graph.pages.get('journals/2026-09-02.md')!.kind).toBe('journal')
    expect(index.graph.pages.get('journals.md')!.kind).toBe('page')
    expect(index.graph.pages.get('Welcome.md')!.kind).toBe('page')
  })

  it('extracts outgoing links per page', async () => {
    const tree = buildTree({ 'a.md': 'see #Inbox and #[[reading list]]' })
    const index = await buildIndex(vault(tree))
    expect(index.graph.pages.get('a.md')!.links).toEqual([
      { target: 'Inbox', via: 'word' },
      { target: 'reading list', via: 'bracketed' },
    ])
  })

  it('resolves references case-insensitively through byName', async () => {
    const tree = buildTree({
      'Folio.md': '#Welcome #FOLIO',
      'Welcome.md': 'hi',
    })
    const index = await buildIndex(vault(tree))
    expect(index.graph.byName.get('folio')).toBe('Folio.md')
    expect(index.graph.pages.get('Folio.md')!.links[1]).toEqual({
      target: 'FOLIO',
      via: 'word',
    })
  })

  it('keeps references to pages that do not exist', async () => {
    const tree = buildTree({ 'a.md': '#[[feature roadmap]]' })
    const index = await buildIndex(vault(tree))
    expect(index.graph.pages.get('a.md')!.links).toEqual([
      { target: 'feature roadmap', via: 'bracketed' },
    ])
  })

  it('picks the first-by-path page for case-only collisions', async () => {
    const tree = buildTree({ 'project.md': 'see #Project', 'Project.md': '#project' })
    const index = await buildIndex(vault(tree))
    // 'Project.md' sorts before 'project.md' (ASCII), so it wins resolution.
    expect(index.graph.byName.get('project')).toBe('Project.md')
    // project.md -> #Project resolves to Project.md: a real backlink.
    expect(index.graph.backlinks.get('project')).toEqual(['project.md'])
    // Project.md -> #project is a self-link: absent from backlinks.
  })

  it('folds backlinks across every lexical form and excludes self-links', async () => {
    const tree = buildTree({
      'a.md': '#Topic',
      'b.md': '#[[Topic]]',
      'Topic.md': '#Topic #ideas',
    })
    const index = await buildIndex(vault(tree))
    expect(index.graph.backlinks.get('topic')).toEqual(['a.md', 'b.md'])
    expect(index.graph.backlinks.get('ideas')).toEqual(['Topic.md'])
    expect(index.graph.pages.get('Topic.md')!.links).toEqual([
      { target: 'Topic', via: 'word' },
      { target: 'ideas', via: 'word' },
    ])
  })
})

describe('parsePins (pins meta file, design D1)', () => {
  it('keeps the ordered page paths from a real pins file', () => {
    const content =
      '# Pinned pages - order is pin order, most recent first\n\n- b.md\n- a.md\n- projects/roadmap.md\n'
    expect(parsePins(content)).toEqual(['b.md', 'a.md', 'projects/roadmap.md'])
  })

  it('accepts bare-path hand-edited lines', () => {
    expect(parsePins('- Ideas.md\nnotes.md\n')).toEqual(['Ideas.md', 'notes.md'])
  })

  it('ignores junk and non-page lines but preserves order', () => {
    expect(parsePins('\n# a comment\n- Ideas.md\nwhat is this\n\n- assets/x.md\n')).toEqual([
      'Ideas.md',
    ])
  })

  it('a journal day is a valid page path: parses, but the UI never pin-able', () => {
    expect(parsePins('- journals/2026-09-08.md\n')).toEqual(['journals/2026-09-08.md'])
  })

  it('an empty file yields no pins', () => {
    expect(parsePins('')).toEqual([])
    expect(parsePins('# only a header\n')).toEqual([])
  })
})

describe('pins in the index (design D1/D3)', () => {
  it('reads the meta file into pins and never as a page', async () => {
    const tree = buildTree({
      'a.md': 'a',
      'b.md': 'b',
      '.folio': { 'pins.md': '# Pinned pages\n\n- b.md\n- a.md\n' },
    })
    const index = await buildIndex(vault(tree))
    expect(index.pins).toEqual(['b.md', 'a.md'])
    expect(index.graph.pages.has('.folio/pins.md')).toBe(false)
    expect(index.snapshot.get('.folio/pins.md')).toBeGreaterThan(0)
  })

  it('a missing meta file means no pins', async () => {
    const index = await buildIndex(vault(buildTree({ 'a.md': 'a' })))
    expect(index.pins).toEqual([])
  })

  it('carries pins by identity when the meta file is unchanged', async () => {
    const tree = buildTree({ 'a.md': 'a', '.folio': { 'pins.md': '- a.md\n' } })
    const storage = vault(tree)
    const first = await buildIndex(storage)
    const second = await refreshIndex(storage, first)
    expect(second.pins).toBe(first.pins)
  })

  it('picks up an external edit to the meta file on refresh', async () => {
    const root = buildTree({ 'a.md': 'a', 'b.md': 'b', '.folio': { 'pins.md': '- a.md\n' } })
    const storage = vault(root)
    const first = await buildIndex(storage)
    const pinsFile = (root.children.get('.folio') as FakeDirectoryHandle).children.get(
      'pins.md',
    ) as FakeFileHandle
    await pinsFile.writeContent('- b.md\n- a.md\n')
    const second = await refreshIndex(storage, first)
    expect(second.pins).toEqual(['b.md', 'a.md'])
  })

  it('upserts pins through to disk and heals the snapshot', async () => {
    const tree = buildTree({ 'a.md': 'a', 'b.md': 'b' })
    const storage = vault(tree)
    const first = await buildIndex(storage)
    expect(first.pins).toEqual([])

    const next = await upsertPins(storage, first, ['b.md', 'a.md'])
    expect(next.pins).toEqual(['b.md', 'a.md'])
    expect(await storage.read('.folio/pins.md')).toContain('- b.md')
    // Snapshot healed: the next refresh carries pins by identity.
    const refreshed = await refreshIndex(storage, next)
    expect(refreshed.pins).toBe(next.pins)
    // A pin edit never disturbs page records.
    expect(refreshed.graph.pages.get('a.md')).toBe(first.graph.pages.get('a.md'))
  })

  it('a failed pin write leaves the pins and the file unchanged', async () => {
    const root = buildTree({ 'a.md': 'a', '.folio': { 'pins.md': '- a.md\n' } })
    const storage = vault(root)
    const first = await buildIndex(storage)
    const pinsFile = (root.children.get('.folio') as FakeDirectoryHandle).children.get(
      'pins.md',
    ) as FakeFileHandle
    pinsFile.createWritable = async () => {
      throw new DOMException('denied', 'SecurityError')
    }
    await expect(upsertPins(storage, first, [])).rejects.toThrow('denied')
    expect(first.pins).toEqual(['a.md'])
    expect(await storage.read('.folio/pins.md')).toContain('- a.md')
  })

  it('a saved page preserves the pins list', async () => {
    const tree = buildTree({ 'a.md': 'v1', '.folio': { 'pins.md': '- a.md\n' } })
    const storage = vault(tree)
    const first = await buildIndex(storage)
    const saved = await upsertPage(storage, first, 'a.md', 'v2')
    expect(saved.pins).toEqual(['a.md'])
  })
})

describe('page last-modified time (add-pinned-pages)', () => {
  const fileOf = (tree: ReturnType<typeof buildTree>, path: string): FakeFileHandle =>
    tree.children.get(path) as FakeFileHandle

  it('a scanned page carries the file lastModified', async () => {
    const tree = buildTree({ 'a.md': 'v1' })
    const index = await buildIndex(vault(tree))
    expect(index.graph.pages.get('a.md')!.lastModified).toBe(fileOf(tree, 'a.md').lastModified)
  })

  it('an upserted page carries the post-write lastModified', async () => {
    const tree = buildTree({ 'a.md': 'v1' })
    const storage = vault(tree)
    const first = await buildIndex(storage)
    const saved = await upsertPage(storage, first, 'a.md', 'v2')
    expect(saved.graph.pages.get('a.md')!.lastModified).toBe(fileOf(tree, 'a.md').lastModified)
  })

  it('a carried page preserves its lastModified by identity', async () => {
    const tree = buildTree({ 'a.md': 'v1' })
    const storage = vault(tree)
    const first = await buildIndex(storage)
    const second = await refreshIndex(storage, first)
    expect(second.graph.pages.get('a.md')!.lastModified).toBe(
      first.graph.pages.get('a.md')!.lastModified,
    )
    expect(second.graph.pages.get('a.md')).toBe(first.graph.pages.get('a.md'))
  })
})

describe('orderPages (sidebar list order, design D5)', () => {
  const mk = (path: string, lastModified: number): IndexPage => ({
    path,
    title: path.replace(/\.md$/, ''),
    kind: 'page',
    content: '',
    links: [],
    lastModified,
  })

  it('pins first in pin order, then the rest by last-modified descending', () => {
    const a = mk('a.md', 1)
    const b = mk('b.md', 2)
    const c = mk('c.md', 3)
    expect(orderPages([a, b, c], ['b.md']).map((p) => p.path)).toEqual(['b.md', 'c.md', 'a.md'])
  })

  it('pin-file order wins over mtime among pinned pages', () => {
    const a = mk('a.md', 1)
    const c = mk('c.md', 3)
    expect(orderPages([a, c], ['a.md', 'c.md']).map((p) => p.path)).toEqual(['a.md', 'c.md'])
  })

  it('equal mtimes break by path ascending', () => {
    const a = mk('a.md', 5)
    const b = mk('b.md', 5)
    const c = mk('c.md', 5)
    expect(orderPages([c, a, b], []).map((p) => p.path)).toEqual(['a.md', 'b.md', 'c.md'])
  })

  it('empty pins falls back to pure edit order', () => {
    const a = mk('a.md', 1)
    const b = mk('b.md', 2)
    const c = mk('c.md', 3)
    expect(orderPages([a, b, c], []).map((p) => p.path)).toEqual(['c.md', 'b.md', 'a.md'])
  })

  it('skips pins naming no page in the set (self-healing)', () => {
    const a = mk('a.md', 1)
    const b = mk('b.md', 2)
    expect(orderPages([a, b], ['missing.md', 'a.md']).map((p) => p.path)).toEqual(['a.md', 'b.md'])
  })
})

describe('refreshIndex (diff-rescan)', () => {
  it('carries unchanged pages over without re-reading (object identity)', async () => {
    const tree = buildTree({ 'Ideas.md': 'v1 #One', 'Other.md': 'still' })
    const storage = vault(tree)
    const first = await buildIndex(storage)
    const second = await refreshIndex(storage, first)
    expect(second.graph.pages.get('Other.md')).toBe(first.graph.pages.get('Other.md'))
    expect(second.graph.pages.get('Ideas.md')).toBe(first.graph.pages.get('Ideas.md'))
  })

  it('picks up a file added externally', async () => {
    const root = buildTree({ 'Ideas.md': 'v1 #One' })
    const storage = vault(root)
    const first = await buildIndex(storage)
    root.children.set('New.md', new FakeFileHandle('New.md', 'hello #Two'))
    const second = await refreshIndex(storage, first)
    expect(second.graph.pages.has('New.md')).toBe(true)
    expect(second.graph.backlinks.get('two')).toEqual(['New.md'])
  })

  it('updates links and backlinks for a file modified externally', async () => {
    const root = buildTree({ 'Ideas.md': 'v1 #One', 'Other.md': 'still' })
    const storage = vault(root)
    const first = await buildIndex(storage)
    const ideas = root.children.get('Ideas.md') as FakeFileHandle
    await ideas.writeContent('v2 #One #Three')
    const second = await refreshIndex(storage, first)
    const page = second.graph.pages.get('Ideas.md')!
    expect(page.content).toBe('v2 #One #Three')
    expect(page.links).toEqual([
      { target: 'One', via: 'word' },
      { target: 'Three', via: 'word' },
    ])
    expect(second.graph.backlinks.get('three')).toEqual(['Ideas.md'])
    // Unchanged file still carried over by identity.
    expect(second.graph.pages.get('Other.md')).toBe(first.graph.pages.get('Other.md'))
  })

  it('drops a file removed externally', async () => {
    const root = buildTree({ 'Ideas.md': 'v1', 'Other.md': 'still' })
    const storage = vault(root)
    const first = await buildIndex(storage)
    root.children.delete('Other.md')
    const second = await refreshIndex(storage, first)
    expect(second.graph.pages.has('Other.md')).toBe(false)
    expect(second.graph.pages.has('Ideas.md')).toBe(true)
  })

  it('ignores asset files on refresh (scenario: asset write disturbs nothing)', async () => {
    const root = buildTree({ 'Ideas.md': 'v1 #One' })
    const storage = vault(root)
    const first = await buildIndex(storage)
    // An asset lands under assets/ (the drop-copy flow) — no page appears.
    await storage.writeBinary('assets/notes.md', new Blob(['not a page']))
    const second = await refreshIndex(storage, first)
    expect(second.graph.pages.has('assets/notes.md')).toBe(false)
    expect(second.graph.pages.has('Ideas.md')).toBe(true)
  })

  it('upserts a saved page into the index immediately (B1)', async () => {
    const root = buildTree({ 'a.md': 'v1 #One', 'b.md': 'see #Two' })
    const storage = vault(root)
    const first = await buildIndex(storage)
    const second = await upsertPage(storage, first, 'a.md', 'v2 #One #New')
    const page = second.graph.pages.get('a.md')!
    expect(page.content).toBe('v2 #One #New')
    expect(page.links).toEqual([
      { target: 'One', via: 'word' },
      { target: 'New', via: 'word' },
    ])
    // Unchanged pages carried over by identity.
    expect(second.graph.pages.get('b.md')).toBe(first.graph.pages.get('b.md'))
  })

  it('re-derives backlinks from the saved edit', async () => {
    const root = buildTree({ 'a.md': 'see #Old', 'b.md': 'other #Old' })
    const storage = vault(root)
    const first = await buildIndex(storage)
    const second = await upsertPage(storage, first, 'a.md', 'see #New')
    expect(second.graph.backlinks.get('old')).toEqual(['b.md'])
    expect(second.graph.backlinks.get('new')).toEqual(['a.md'])
  })

  it('heals the snapshot so the next refresh skips the written file', async () => {
    const root = buildTree({ 'a.md': 'v1' })
    const storage = vault(root)
    const first = await buildIndex(storage)
    const saved = await upsertPage(storage, first, 'a.md', 'v2')
    const refreshed = await refreshIndex(storage, saved)
    // The refresh carried the upserted page by identity — nothing re-read.
    expect(refreshed.graph.pages.get('a.md')).toBe(saved.graph.pages.get('a.md'))
    expect(refreshed.snapshot.get('a.md')).toBe(saved.snapshot.get('a.md'))
  })

  it('a failed write leaves the index unchanged', async () => {
    const root = buildTree({ 'a.md': 'v1' })
    const storage = vault(root)
    const first = await buildIndex(storage)
    const failWrite = upsertPage(storage, first, 'a.md', 'v2')
    // Force the filesystem write to reject by removing the file's writable
    // capability: stub createWritable to throw on the fake.
    const file = root.children.get('a.md') as FakeFileHandle
    file.createWritable = async () => {
      throw new DOMException('denied', 'SecurityError')
    }
    await expect(failWrite).rejects.toThrow('denied')
    expect(first.graph.pages.get('a.md')!.content).toBe('v1')
  })
})

describe('journalDate (calendar day derivation, journal-calendar)', () => {
  it('extracts the date from a journal day path', () => {
    expect(journalDate('journals/2026-09-06.md')).toBe('2026-09-06')
  })

  it('returns null for non-date journal files (no calendar cell)', () => {
    expect(journalDate('journals/notes.md')).toBeNull()
    expect(journalDate('journals/2026-09-06-extra.md')).toBeNull()
  })

  it('returns null for non-journal pages', () => {
    expect(journalDate('Welcome.md')).toBeNull()
    expect(journalDate('notes/2026-09-06.md')).toBeNull()
  })
})
