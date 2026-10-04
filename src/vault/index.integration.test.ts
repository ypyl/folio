import { describe, expect, it } from 'vitest'
import { FakeFileHandle, buildTree, type FakeDirectoryHandle } from './fakeHandle'
import { FileSystemVaultStorage } from './fs'
import {
  assetName,
  boardName,
  boardPathForName,
  boardReferrers,
  boardStem,
  buildIndex,
  hasHiddenSegment,
  isBoardPath,
  isPagePath,
  journalDate,
  journalDayName,
  journalDayPath,
  kindOf,
  listAssets,
  listBoards,
  orderPages,
  pageAssets,
  parsePins,
  resolveBoardPath,
  resolveReferencePath,
  stem,
  upsertBoard,
  upsertPage,
  upsertPins,
  type IndexPage,
} from './index'

function vault(tree: FakeDirectoryHandle): FileSystemVaultStorage {
  return new FileSystemVaultStorage(tree as unknown as FileSystemDirectoryHandle)
}

/** Walk a nested fake tree to a file handle, so tests can poke a page's file. */
function fileOf(root: FakeDirectoryHandle, path: string): FakeFileHandle {
  const segments = path.split('/')
  let dir = root
  for (const segment of segments.slice(0, -1)) {
    dir = dir.children.get(segment) as FakeDirectoryHandle
  }
  return dir.children.get(segments[segments.length - 1]) as FakeFileHandle
}

describe('isPagePath (scan scope, pages-folder-layout design D2)', () => {
  it('accepts pages/ and journals/ markdown files', () => {
    expect(isPagePath('pages/a.md')).toBe(true)
    expect(isPagePath('journals/2026-09-02.md')).toBe(true)
  })

  it('accepts upper-case extensions', () => {
    expect(isPagePath('pages/NOTES.MD')).toBe(true)
    expect(isPagePath('journals/2026-09-02.MD')).toBe(true)
  })

  it('rejects non-markdown files', () => {
    expect(isPagePath('pages/image.png')).toBe(false)
    expect(isPagePath('pages/notes.txt')).toBe(false)
    expect(isPagePath('pages/README')).toBe(false)
  })

  it('rejects markdown outside pages/ and journals/', () => {
    expect(isPagePath('Welcome.md')).toBe(false)
    expect(isPagePath('notes/random.md')).toBe(false)
    expect(isPagePath('assets/notes.md')).toBe(false)
    expect(isPagePath('Assets/notes.md')).toBe(false)
    expect(isPagePath('journals.md')).toBe(false)
    expect(isPagePath('pages.md')).toBe(false)
  })

  it('rejects hidden paths at any depth', () => {
    expect(isPagePath('pages/.hidden.md')).toBe(false)
    expect(isPagePath('pages/.spot/x.md')).toBe(false)
    expect(isPagePath('.folio/pins.md')).toBe(false)
    expect(isPagePath('.obsidian/plugins/x.md')).toBe(false)
  })

  it('rejects date-named files under pages/ but not under journals/', () => {
    expect(isPagePath('pages/2026-09-16.md')).toBe(false)
    expect(isPagePath('pages/notes/2026-09-16.md')).toBe(false)
    expect(isPagePath('pages/2026-13-45.md')).toBe(true)
    expect(isPagePath('journals/2026-09-16.md')).toBe(true)
  })
})

describe('page name and kind (pages-folder-layout)', () => {
  it('stems a pages/ path to its filename', () => {
    expect(stem('pages/MyPage.md')).toBe('MyPage')
  })

  it('classifies pages/ paths as pages and journals/ paths as journals', () => {
    expect(kindOf('pages/MyPage.md')).toBe('page')
    expect(kindOf('journals/2026-09-02.md')).toBe('journal')
  })
})

describe('buildIndex', () => {
  it('indexes pages/ and journals/ markdown with path, title, kind, and content', async () => {
    const tree = buildTree({
      pages: {
        'Welcome.md': '# Welcome',
        projects: { 'ideas.md': 'an idea' },
        'NOTES.MD': 'upper',
        'draft.v2.md': 'multi-dot',
        'journals.md': 'not a journal',
        'image.png': 'png',
      },
      journals: { '2026-09-02.md': 'daily' },
      '.obsidian': { plugins: { 'x.md': 'hidden' } },
    })
    const index = await buildIndex(vault(tree))

    expect([...index.graph.pages.keys()]).toEqual([
      'journals/2026-09-02.md',
      'pages/NOTES.MD',
      'pages/Welcome.md',
      'pages/draft.v2.md',
      'pages/journals.md',
      'pages/projects/ideas.md',
    ])
    expect(index.graph.pages.get('pages/draft.v2.md')!.title).toBe('draft.v2')
    expect(index.graph.pages.get('pages/NOTES.MD')!.title).toBe('NOTES')
    expect(index.graph.pages.get('pages/projects/ideas.md')!.content).toBe('an idea')
    expect(index.graph.pages.get('journals/2026-09-02.md')!.kind).toBe('journal')
    expect(index.graph.pages.get('pages/journals.md')!.kind).toBe('page')
    expect(index.graph.pages.get('pages/Welcome.md')!.kind).toBe('page')
  })

  it('ignores root-level markdown files', async () => {
    const tree = buildTree({ 'Welcome.md': 'root', pages: { 'Real.md': 'page' } })
    const index = await buildIndex(vault(tree))
    expect([...index.graph.pages.keys()]).toEqual(['pages/Real.md'])
  })

  it('drops a date-named file under pages/ and the references it holds', async () => {
    const tree = buildTree({
      pages: { '2026-09-16.md': 'see #Roadmap', '2026-13-45.md': 'not a day' },
    })
    const index = await buildIndex(vault(tree))

    expect([...index.graph.pages.keys()]).toEqual(['pages/2026-13-45.md'])
    expect(index.graph.byName.has('2026-09-16')).toBe(false)
    expect(index.graph.backlinks.get('roadmap')).toBeUndefined()
  })

  it('extracts outgoing links per page', async () => {
    const tree = buildTree({ pages: { 'a.md': 'see #Inbox and #[[reading list]]' } })
    const index = await buildIndex(vault(tree))
    expect(index.graph.pages.get('pages/a.md')!.links).toEqual([
      { target: 'Inbox', via: 'word' },
      { target: 'reading list', via: 'bracketed' },
    ])
  })

  it('resolves references case-insensitively through byName', async () => {
    const tree = buildTree({
      pages: {
        'Folio.md': '#Welcome #FOLIO',
        'Welcome.md': 'hi',
      },
    })
    const index = await buildIndex(vault(tree))
    expect(index.graph.byName.get('folio')).toBe('pages/Folio.md')
    expect(index.graph.pages.get('pages/Folio.md')!.links[1]).toEqual({
      target: 'FOLIO',
      via: 'word',
    })
  })

  it('keeps references to pages that do not exist', async () => {
    const tree = buildTree({ pages: { 'a.md': '#[[feature roadmap]]' } })
    const index = await buildIndex(vault(tree))
    expect(index.graph.pages.get('pages/a.md')!.links).toEqual([
      { target: 'feature roadmap', via: 'bracketed' },
    ])
  })

  it('picks the first-by-path page for case-only collisions', async () => {
    const tree = buildTree({
      pages: { 'project.md': 'see #Project', 'Project.md': '#project' },
    })
    const index = await buildIndex(vault(tree))
    // 'Project.md' sorts before 'project.md' (ASCII), so it wins resolution.
    expect(index.graph.byName.get('project')).toBe('pages/Project.md')
    // project.md -> #Project resolves to Project.md: a real backlink.
    expect(index.graph.backlinks.get('project')).toEqual(['pages/project.md'])
    // Project.md -> #project is a self-link: absent from backlinks.
  })

  it('folds backlinks across every lexical form and excludes self-links', async () => {
    const tree = buildTree({
      pages: {
        'a.md': '#Topic',
        'b.md': '#[[Topic]]',
        'Topic.md': '#Topic #ideas',
      },
    })
    const index = await buildIndex(vault(tree))
    expect(index.graph.backlinks.get('topic')).toEqual(['pages/a.md', 'pages/b.md'])
    expect(index.graph.backlinks.get('ideas')).toEqual(['pages/Topic.md'])
    expect(index.graph.pages.get('pages/Topic.md')!.links).toEqual([
      { target: 'Topic', via: 'word' },
      { target: 'ideas', via: 'word' },
    ])
  })
})

describe('parsePins (pins meta file, design D1)', () => {
  it('keeps the ordered page paths from a real pins file', () => {
    const content =
      '# Pinned pages - order is pin order, most recent first\n\n- pages/b.md\n- pages/a.md\n- pages/projects/roadmap.md\n'
    expect(parsePins(content)).toEqual(['pages/b.md', 'pages/a.md', 'pages/projects/roadmap.md'])
  })

  it('accepts bare-path hand-edited lines', () => {
    expect(parsePins('- pages/Ideas.md\npages/notes.md\n')).toEqual([
      'pages/Ideas.md',
      'pages/notes.md',
    ])
  })

  it('ignores junk and out-of-scope lines but preserves order', () => {
    expect(parsePins('\n# a comment\n- pages/Ideas.md\nwhat is this\n\n- assets/x.md\n')).toEqual([
      'pages/Ideas.md',
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
      pages: { 'a.md': 'a', 'b.md': 'b' },
      '.folio': { 'pins.md': '# Pinned pages\n\n- pages/b.md\n- pages/a.md\n' },
    })
    const index = await buildIndex(vault(tree))
    expect(index.pins).toEqual(['pages/b.md', 'pages/a.md'])
    expect(index.graph.pages.has('.folio/pins.md')).toBe(false)
    expect(index.snapshot.get('.folio/pins.md')).toBeGreaterThan(0)
  })

  it('a missing meta file means no pins', async () => {
    const index = await buildIndex(vault(buildTree({ pages: { 'a.md': 'a' } })))
    expect(index.pins).toEqual([])
  })

  it('carries pins by identity when the meta file is unchanged', async () => {
    const tree = buildTree({
      pages: { 'a.md': 'a' },
      '.folio': { 'pins.md': '- pages/a.md\n' },
    })
    const storage = vault(tree)
    const first = await buildIndex(storage)
    const second = await buildIndex(storage, first)
    expect(second.pins).toBe(first.pins)
  })

  it('picks up an external edit to the meta file on refresh', async () => {
    const root = buildTree({
      pages: { 'a.md': 'a', 'b.md': 'b' },
      '.folio': { 'pins.md': '- pages/a.md\n' },
    })
    const storage = vault(root)
    const first = await buildIndex(storage)
    const pinsFile = (root.children.get('.folio') as FakeDirectoryHandle).children.get(
      'pins.md',
    ) as FakeFileHandle
    await pinsFile.writeContent('- pages/b.md\n- pages/a.md\n')
    const second = await buildIndex(storage, first)
    expect(second.pins).toEqual(['pages/b.md', 'pages/a.md'])
  })

  it('upserts pins through to disk and heals the snapshot', async () => {
    const tree = buildTree({ pages: { 'a.md': 'a', 'b.md': 'b' } })
    const storage = vault(tree)
    const first = await buildIndex(storage)
    expect(first.pins).toEqual([])

    const next = await upsertPins(storage, first, ['pages/b.md', 'pages/a.md'])
    expect(next.pins).toEqual(['pages/b.md', 'pages/a.md'])
    expect(await storage.read('.folio/pins.md')).toContain('- pages/b.md')
    // Snapshot healed: the next refresh carries pins by identity.
    const refreshed = await buildIndex(storage, next)
    expect(refreshed.pins).toBe(next.pins)
    // A pin edit never disturbs page records.
    expect(refreshed.graph.pages.get('pages/a.md')).toBe(first.graph.pages.get('pages/a.md'))
  })

  it('a failed pin write leaves the pins and the file unchanged', async () => {
    const root = buildTree({
      pages: { 'a.md': 'a' },
      '.folio': { 'pins.md': '- pages/a.md\n' },
    })
    const storage = vault(root)
    const first = await buildIndex(storage)
    const pinsFile = (root.children.get('.folio') as FakeDirectoryHandle).children.get(
      'pins.md',
    ) as FakeFileHandle
    pinsFile.createWritable = async () => {
      throw new DOMException('denied', 'SecurityError')
    }
    await expect(upsertPins(storage, first, [])).rejects.toThrow('denied')
    expect(first.pins).toEqual(['pages/a.md'])
    expect(await storage.read('.folio/pins.md')).toContain('- pages/a.md')
  })

  it('a saved page preserves the pins list', async () => {
    const tree = buildTree({
      pages: { 'a.md': 'v1' },
      '.folio': { 'pins.md': '- pages/a.md\n' },
    })
    const storage = vault(tree)
    const first = await buildIndex(storage)
    const saved = await upsertPage(storage, first, 'pages/a.md', 'v2')
    expect(saved.pins).toEqual(['pages/a.md'])
  })
})

describe('page last-modified time (add-pinned-pages)', () => {
  it('a scanned page carries the file lastModified', async () => {
    const tree = buildTree({ pages: { 'a.md': 'v1' } })
    const index = await buildIndex(vault(tree))
    expect(index.graph.pages.get('pages/a.md')!.lastModified).toBe(
      fileOf(tree, 'pages/a.md').lastModified,
    )
  })

  it('an upserted page carries the post-write lastModified', async () => {
    const tree = buildTree({ pages: { 'a.md': 'v1' } })
    const storage = vault(tree)
    const first = await buildIndex(storage)
    const saved = await upsertPage(storage, first, 'pages/a.md', 'v2')
    expect(saved.graph.pages.get('pages/a.md')!.lastModified).toBe(
      fileOf(tree, 'pages/a.md').lastModified,
    )
  })

  it('a carried page preserves its lastModified by identity', async () => {
    const tree = buildTree({ pages: { 'a.md': 'v1' } })
    const storage = vault(tree)
    const first = await buildIndex(storage)
    const second = await buildIndex(storage, first)
    expect(second.graph.pages.get('pages/a.md')!.lastModified).toBe(
      first.graph.pages.get('pages/a.md')!.lastModified,
    )
    expect(second.graph.pages.get('pages/a.md')).toBe(first.graph.pages.get('pages/a.md'))
  })
})

describe('orderPages (sidebar list order, design D5)', () => {
  const mk = (path: string, lastModified: number): IndexPage => ({
    path,
    title: path.replace(/\.md$/, ''),
    kind: 'page',
    content: '',
    links: [],
    assets: [],
    boards: [],
    lastModified,
  })

  it('pins first in pin order, then the rest by last-modified descending', () => {
    const a = mk('pages/a.md', 1)
    const b = mk('pages/b.md', 2)
    const c = mk('pages/c.md', 3)
    expect(orderPages([a, b, c], ['pages/b.md']).map((p) => p.path)).toEqual([
      'pages/b.md',
      'pages/c.md',
      'pages/a.md',
    ])
  })

  it('pin-file order wins over mtime among pinned pages', () => {
    const a = mk('pages/a.md', 1)
    const c = mk('pages/c.md', 3)
    expect(orderPages([a, c], ['pages/a.md', 'pages/c.md']).map((p) => p.path)).toEqual([
      'pages/a.md',
      'pages/c.md',
    ])
  })

  it('equal mtimes break by path ascending', () => {
    const a = mk('pages/a.md', 5)
    const b = mk('pages/b.md', 5)
    const c = mk('pages/c.md', 5)
    expect(orderPages([c, a, b], []).map((p) => p.path)).toEqual([
      'pages/a.md',
      'pages/b.md',
      'pages/c.md',
    ])
  })

  it('empty pins falls back to pure edit order', () => {
    const a = mk('pages/a.md', 1)
    const b = mk('pages/b.md', 2)
    const c = mk('pages/c.md', 3)
    expect(orderPages([a, b, c], []).map((p) => p.path)).toEqual([
      'pages/c.md',
      'pages/b.md',
      'pages/a.md',
    ])
  })

  it('skips pins naming no page in the set (self-healing)', () => {
    const a = mk('pages/a.md', 1)
    const b = mk('pages/b.md', 2)
    expect(orderPages([a, b], ['pages/missing.md', 'pages/a.md']).map((p) => p.path)).toEqual([
      'pages/a.md',
      'pages/b.md',
    ])
  })
})

describe('buildIndex (diff-rescan)', () => {
  it('carries unchanged pages over without re-reading (object identity)', async () => {
    const tree = buildTree({ pages: { 'Ideas.md': 'v1 #One', 'Other.md': 'still' } })
    const storage = vault(tree)
    const first = await buildIndex(storage)
    const second = await buildIndex(storage, first)
    expect(second.graph.pages.get('pages/Other.md')).toBe(first.graph.pages.get('pages/Other.md'))
    expect(second.graph.pages.get('pages/Ideas.md')).toBe(first.graph.pages.get('pages/Ideas.md'))
  })

  it('picks up a file added externally', async () => {
    const root = buildTree({ pages: { 'Ideas.md': 'v1 #One' } })
    const storage = vault(root)
    const first = await buildIndex(storage)
    ;(root.children.get('pages') as FakeDirectoryHandle).children.set(
      'New.md',
      new FakeFileHandle('New.md', 'hello #Two'),
    )
    const second = await buildIndex(storage, first)
    expect(second.graph.pages.has('pages/New.md')).toBe(true)
    expect(second.graph.backlinks.get('two')).toEqual(['pages/New.md'])
  })

  it('updates links and backlinks for a file modified externally', async () => {
    const root = buildTree({ pages: { 'Ideas.md': 'v1 #One', 'Other.md': 'still' } })
    const storage = vault(root)
    const first = await buildIndex(storage)
    const ideas = fileOf(root, 'pages/Ideas.md')
    await ideas.writeContent('v2 #One #Three')
    const second = await buildIndex(storage, first)
    const page = second.graph.pages.get('pages/Ideas.md')!
    expect(page.content).toBe('v2 #One #Three')
    expect(page.links).toEqual([
      { target: 'One', via: 'word' },
      { target: 'Three', via: 'word' },
    ])
    expect(second.graph.backlinks.get('three')).toEqual(['pages/Ideas.md'])
    // Unchanged file still carried over by identity.
    expect(second.graph.pages.get('pages/Other.md')).toBe(first.graph.pages.get('pages/Other.md'))
  })

  it('drops a file removed externally', async () => {
    const root = buildTree({ pages: { 'Ideas.md': 'v1', 'Other.md': 'still' } })
    const storage = vault(root)
    const first = await buildIndex(storage)
    ;(root.children.get('pages') as FakeDirectoryHandle).children.delete('Other.md')
    const second = await buildIndex(storage, first)
    expect(second.graph.pages.has('pages/Other.md')).toBe(false)
    expect(second.graph.pages.has('pages/Ideas.md')).toBe(true)
  })

  it('ignores asset files on refresh (scenario: asset write disturbs nothing)', async () => {
    const root = buildTree({ pages: { 'Ideas.md': 'v1 #One' } })
    const storage = vault(root)
    const first = await buildIndex(storage)
    // An asset lands under assets/ (the drop-copy flow) — no page appears.
    await storage.writeBinary('assets/notes.md', new Blob(['not a page']))
    const second = await buildIndex(storage, first)
    expect(second.graph.pages.has('assets/notes.md')).toBe(false)
    expect(second.graph.pages.has('pages/Ideas.md')).toBe(true)
    // ...but it is inventoried, and the page set is otherwise untouched.
    expect(second.graph.assets).toEqual(['assets/notes.md'])
    expect(second.graph.pages.size).toBe(first.graph.pages.size)
  })

  it('upserts a saved page into the index immediately (B1)', async () => {
    const root = buildTree({ pages: { 'a.md': 'v1 #One', 'b.md': 'see #Two' } })
    const storage = vault(root)
    const first = await buildIndex(storage)
    const second = await upsertPage(storage, first, 'pages/a.md', 'v2 #One #New')
    const page = second.graph.pages.get('pages/a.md')!
    expect(page.content).toBe('v2 #One #New')
    expect(page.links).toEqual([
      { target: 'One', via: 'word' },
      { target: 'New', via: 'word' },
    ])
    // Unchanged pages carried over by identity.
    expect(second.graph.pages.get('pages/b.md')).toBe(first.graph.pages.get('pages/b.md'))
  })

  it('re-derives backlinks from the saved edit', async () => {
    const root = buildTree({ pages: { 'a.md': 'see #Old', 'b.md': 'other #Old' } })
    const storage = vault(root)
    const first = await buildIndex(storage)
    const second = await upsertPage(storage, first, 'pages/a.md', 'see #New')
    expect(second.graph.backlinks.get('old')).toEqual(['pages/b.md'])
    expect(second.graph.backlinks.get('new')).toEqual(['pages/a.md'])
  })

  it('heals the snapshot so the next refresh skips the written file', async () => {
    const root = buildTree({ pages: { 'a.md': 'v1' } })
    const storage = vault(root)
    const first = await buildIndex(storage)
    const saved = await upsertPage(storage, first, 'pages/a.md', 'v2')
    const refreshed = await buildIndex(storage, saved)
    // The refresh carried the upserted page by identity — nothing re-read.
    expect(refreshed.graph.pages.get('pages/a.md')).toBe(saved.graph.pages.get('pages/a.md'))
    expect(refreshed.snapshot.get('pages/a.md')).toBe(saved.snapshot.get('pages/a.md'))
  })

  it('a failed write leaves the index unchanged', async () => {
    const root = buildTree({ pages: { 'a.md': 'v1' } })
    const storage = vault(root)
    const first = await buildIndex(storage)
    const failWrite = upsertPage(storage, first, 'pages/a.md', 'v2')
    // Force the filesystem write to reject by removing the file's writable
    // capability: stub createWritable to throw on the fake.
    const file = fileOf(root, 'pages/a.md')
    file.createWritable = async () => {
      throw new DOMException('denied', 'SecurityError')
    }
    await expect(failWrite).rejects.toThrow('denied')
    expect(first.graph.pages.get('pages/a.md')!.content).toBe('v1')
  })
})

describe('asset inventory and references (add-asset-navigation)', () => {
  it('inventories the assets folder path-ordered and never as pages', async () => {
    const tree = buildTree({
      pages: { 'Ideas.md': 'v1' },
      assets: {
        'shot.png': 'png',
        'q3-report.pdf': 'pdf',
        '2026': { 'q3.pdf': 'pdf' },
        '.thumbs': { 'x.png': 'png' },
      },
    })
    const index = await buildIndex(vault(tree))
    expect(index.graph.assets).toEqual([
      'assets/2026/q3.pdf',
      'assets/q3-report.pdf',
      'assets/shot.png',
    ])
    expect(index.graph.pages.has('assets/shot.png')).toBe(false)
    expect(index.graph.assets.some((path) => path.includes('.thumbs'))).toBe(false)
  })

  it('reports the destinations of a page in order and deduped', async () => {
    const tree = buildTree({
      pages: { 'Ideas.md': '[a](assets/a.pdf) ![b](assets/b.png) again [a2](assets/a.pdf)' },
      assets: { 'a.pdf': 'a', 'b.png': 'b' },
    })
    const index = await buildIndex(vault(tree))
    expect(index.graph.pages.get('pages/Ideas.md')!.assets).toEqual([
      'assets/a.pdf',
      'assets/b.png',
    ])
  })

  it('keeps a destination that names no file as a candidate, leaving the answer to the listing', async () => {
    const tree = buildTree({ pages: { 'Ideas.md': '[gone](assets/gone.pdf)' } })
    const index = await buildIndex(vault(tree))
    expect(index.graph.pages.get('pages/Ideas.md')!.assets).toEqual(['assets/gone.pdf'])
    expect(index.graph.files.has('assets/gone.pdf')).toBe(false)
  })

  it('carries candidates with the carried page and re-checks existence from the folder', async () => {
    const tree = buildTree({
      pages: { 'Ideas.md': '[shot](assets/shot.png)' },
      assets: { 'shot.png': 'png' },
    })
    const storage = vault(tree)
    const first = await buildIndex(storage)
    expect(first.graph.files.has('assets/shot.png')).toBe(true)

    await storage.delete('assets/shot.png')
    const second = await buildIndex(storage, first)

    // The page did not change, so it is carried over by identity with its
    // candidates intact (design D1)...
    expect(second.graph.pages.get('pages/Ideas.md')).toBe(first.graph.pages.get('pages/Ideas.md'))
    // ...while the folder's answer — the listing the rows are filtered by — did.
    expect(second.graph.files.has('assets/shot.png')).toBe(false)
    expect(second.graph.assets).toEqual([])
  })

  it('adds a written page to the file listing', async () => {
    const tree = buildTree({ pages: { 'Ideas.md': 'v1' } })
    const storage = vault(tree)
    const first = await buildIndex(storage)
    const second = await upsertPage(storage, first, 'pages/New.md', 'hello')
    expect(second.graph.files.has('pages/New.md')).toBe(true)
  })

  it('re-derives destinations for a saved edit (write-through)', async () => {
    const tree = buildTree({ pages: { 'Ideas.md': 'v1' }, assets: { 'a.pdf': 'a' } })
    const storage = vault(tree)
    const first = await buildIndex(storage)
    const second = await upsertPage(storage, first, 'pages/Ideas.md', '[a](assets/a.pdf)')
    expect(second.graph.pages.get('pages/Ideas.md')!.assets).toEqual(['assets/a.pdf'])
  })

  it('pageAssets keeps only what the vault holds and is not a page', async () => {
    const tree = buildTree({
      pages: { 'Ideas.md': '[a](assets/a.pdf) [gone](assets/gone.pdf) [p](pages/Other.md)' },
      assets: { 'a.pdf': 'a' },
    })
    const index = await buildIndex(vault(tree))
    const page = index.graph.pages.get('pages/Ideas.md')!
    expect(page.assets).toHaveLength(3)
    expect(pageAssets(page, index.graph)).toEqual(['assets/a.pdf'])
  })

  it('labels an asset by its path inside assets/', () => {
    expect(assetName('assets/shot.png')).toBe('shot.png')
    expect(assetName('assets/2026/q3.pdf')).toBe('2026/q3.pdf')
    expect(assetName('media/x.png')).toBe('media/x.png')
  })
})

describe('listAssets (the Assets listing source)', () => {
  it('keeps assets/ paths in path order', () => {
    expect(listAssets(['pages/a.md', 'assets/z.png', 'assets/a.png', 'notes/random.md'])).toEqual([
      'assets/a.png',
      'assets/z.png',
    ])
  })

  it('is empty for a vault with no assets', () => {
    expect(listAssets(['pages/a.md'])).toEqual([])
  })
})

describe('hasHiddenSegment', () => {
  it('flags a dot segment at any depth', () => {
    expect(hasHiddenSegment('.folio/pins.md')).toBe(true)
    expect(hasHiddenSegment('assets/.thumbs/x.png')).toBe(true)
    expect(hasHiddenSegment('.hidden.md')).toBe(true)
  })

  it('passes ordinary paths', () => {
    expect(hasHiddenSegment('assets/a.png')).toBe(false)
    expect(hasHiddenSegment('pages/a.b.md')).toBe(false)
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
    expect(journalDate('pages/Welcome.md')).toBeNull()
    expect(journalDate('pages/notes/2026-09-06.md')).toBeNull()
  })
})

describe('journalDayName and resolveReferencePath (date-references-resolve-to-journals)', () => {
  it('accepts real calendar days, leap day included', () => {
    expect(journalDayName('2026-09-16')).toBe('2026-09-16')
    expect(journalDayName('2024-02-29')).toBe('2024-02-29')
    expect(journalDayPath('2026-09-16')).toBe('journals/2026-09-16.md')
  })

  it('rejects names that are not real zero-padded days', () => {
    expect(journalDayName('2026-02-29')).toBeNull() // 2026 is not a leap year
    expect(journalDayName('2026-13-45')).toBeNull()
    expect(journalDayName('2026-9-6')).toBeNull()
    expect(journalDayName('09-16-2026')).toBeNull()
    expect(journalDayName('2026-09-16T00:00')).toBeNull()
    expect(journalDayName('2026-00-10')).toBeNull()
  })

  it('sends a date name to the journal, whatever the name map says', () => {
    expect(resolveReferencePath('2026-09-16', new Map())).toBe('journals/2026-09-16.md')
    expect(
      resolveReferencePath('2026-09-16', new Map([['2026-09-16', 'pages/2026-09-16.md']])),
    ).toBe('journals/2026-09-16.md')
  })

  it('keeps the ordinary rule for every other name', () => {
    const byName = new Map([['folio', 'pages/Folio.md']])
    expect(resolveReferencePath('Folio', byName)).toBe('pages/Folio.md')
    expect(resolveReferencePath('2026-9-6', new Map())).toBe('pages/2026-9-6.md')
    expect(resolveReferencePath('2026-13-45', new Map())).toBe('pages/2026-13-45.md')
    expect(resolveReferencePath('Missing', new Map())).toBe('pages/Missing.md')
  })
})

describe('boards (add-whiteboards, design D1/D2/D9)', () => {
  it('accepts .excalidraw files under boards/ only', () => {
    expect(isBoardPath('boards/migration.excalidraw')).toBe(true)
    expect(isBoardPath('boards/2026/q3.excalidraw')).toBe(true)
    expect(isBoardPath('boards/MIGRATION.EXCALIDRAW')).toBe(true)
    expect(isBoardPath('notes/migration.excalidraw')).toBe(false)
    expect(isBoardPath('boards/notes.md')).toBe(false)
    expect(isBoardPath('boards/.draft.excalidraw')).toBe(false)
  })

  it('lists boards path-ordered and ignores files outside boards/', () => {
    expect(
      listBoards(['boards/b.excalidraw', 'assets/a.excalidraw', 'boards/a.excalidraw']),
    ).toEqual(['boards/a.excalidraw', 'boards/b.excalidraw'])
  })

  it('labels a board by its path inside boards/ and names it by its stem', () => {
    expect(boardName('boards/2026/q3.excalidraw')).toBe('2026/q3.excalidraw')
    expect(boardStem('boards/2026/q3.excalidraw')).toBe('q3')
    expect(boardPathForName('Migration topology')).toBe('boards/Migration topology.excalidraw')
  })

  it('indexes boards, board references, and referrers', async () => {
    const tree = buildTree({
      pages: {
        'Ideas.md': 'see #!Migration and #![[Migration topology]]',
        'Log.md': '#!migration',
        'Other.md': '#Migration and #[[Migration topology]]',
      },
      boards: { 'Migration.excalidraw': '{}', 'Migration topology.excalidraw': '{}' },
    })
    const index = await buildIndex(vault(tree))
    const graph = index.graph

    expect(graph.boards).toEqual([
      'boards/Migration topology.excalidraw',
      'boards/Migration.excalidraw',
    ])
    expect(graph.pages.get('pages/Ideas.md')!.boards).toEqual([
      { target: 'Migration', via: 'word' },
      { target: 'Migration topology', via: 'bracketed' },
    ])
    expect(graph.boardsByName.get('migration')).toBe('boards/Migration.excalidraw')
    expect(boardReferrers(graph, 'boards/Migration.excalidraw')).toEqual([
      'pages/Ideas.md',
      'pages/Log.md',
    ])
    expect(boardReferrers(graph, 'boards/Migration topology.excalidraw')).toEqual([
      'pages/Ideas.md',
    ])
    // A page reference never counts as a board reference.
    expect(boardReferrers(graph, 'boards/Migration.excalidraw')).not.toContain('pages/Other.md')
  })

  it('resolves a token name to its board, or the path a new board would take', () => {
    const byName = new Map([['migration', 'boards/Migration.excalidraw']])
    expect(resolveBoardPath('migration', byName)).toBe('boards/Migration.excalidraw')
    expect(resolveBoardPath('Architecture', byName)).toBe('boards/Architecture.excalidraw')
  })

  it('adds a saved board to the listing without a rescan', async () => {
    const tree = buildTree({ pages: { 'Ideas.md': '#!Migration' } })
    const storage = vault(tree)
    const first = await buildIndex(storage)
    expect(first.graph.boards).toEqual([])

    const second = await upsertBoard(storage, first, 'boards/Migration.excalidraw', '{}')
    expect(second.graph.boards).toEqual(['boards/Migration.excalidraw'])
    expect(boardReferrers(second.graph, 'boards/Migration.excalidraw')).toEqual(['pages/Ideas.md'])
  })
})
