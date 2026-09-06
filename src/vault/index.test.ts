import { describe, expect, it } from 'vitest'
import { FakeFileHandle, buildTree, type FakeDirectoryHandle } from './fakeHandle'
import { FileSystemVaultStorage } from './fs'
import { buildIndex, isPagePath, refreshIndex } from './index'

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
})