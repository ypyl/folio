import { describe, expect, it } from 'vitest'
import type { VaultStorage } from './storage'
import {
  emptyImportStats,
  humanDateToDay,
  journalFileName,
  normalizeLogseqName,
  rewriteLogseqContent,
  runLogseqImport,
  type ImportProgress,
} from './logseqImport'

describe('normalizeLogseqName', () => {
  it('maps the Logseq escapes to legal, referenceable Folio names', () => {
    expect(normalizeLogseqName('12708 Failed%3A something')).toBe('12708 Failed- something')
    expect(normalizeLogseqName('15282 The %22In progress%22 marker')).toBe(
      "15282 The 'In progress' marker",
    )
    expect(normalizeLogseqName('4879 only DV.%2A projects')).toBe('4879 only DV.x projects')
    expect(normalizeLogseqName('CLC Session %7C AMER')).toBe('CLC Session - AMER')
    expect(normalizeLogseqName('What is Deep Learning%3F')).toBe('What is Deep Learning')
    expect(normalizeLogseqName('doc %3E2 pages')).toBe('doc -2 pages')
  })

  it('maps namespace separators and brackets and strips hidden/trailing characters', () => {
    expect(normalizeLogseqName('17893 High loads___parallel warning')).toBe(
      '17893 High loads-parallel warning',
    )
    expect(normalizeLogseqName('16443 [Spike]Investigate')).toBe('16443 (Spike)Investigate')
    expect(normalizeLogseqName('%2ENET interview')).toBe('NET interview')
    expect(normalizeLogseqName(' Agents')).toBe('Agents')
    expect(normalizeLogseqName('trailing. ')).toBe('trailing')
  })

  it('leaves a literal percent alone when it is not an escape', () => {
    expect(normalizeLogseqName('100% done')).toBe('100% done')
  })
})

describe('humanDateToDay', () => {
  it('converts month-day-year references to zero-padded days', () => {
    expect(humanDateToDay('Apr 30th, 2025')).toBe('2025-04-30')
    expect(humanDateToDay('Jan 2nd, 2025')).toBe('2025-01-02')
    expect(humanDateToDay('Nov 7, 2024')).toBe('2024-11-07')
  })

  it('rejects anything that is not a real calendar day', () => {
    expect(humanDateToDay('Feb 30th, 2025')).toBeNull()
    expect(humanDateToDay('2025-04-30')).toBeNull()
    expect(humanDateToDay('Roadmap')).toBeNull()
  })
})

describe('journalFileName', () => {
  it('turns underscore dates into hyphens and normalizes other stems', () => {
    expect(journalFileName('2024_07_02')).toBe('2024-07-02')
    expect(journalFileName('Some Journal')).toBe('Some Journal')
  })
})

function rewrite(text: string, owners: Record<string, string> = {}): string {
  const map = new Map(Object.entries(owners))
  return rewriteLogseqContent(text, map, 'Note', emptyImportStats())
}

describe('rewriteLogseqContent', () => {
  it('converts plain wikilinks and drops aliases', () => {
    expect(rewrite('See [[Roadmap]]')).toBe('See #[[Roadmap]]')
    expect(rewrite('See [[Roadmap | this year]]')).toBe('See #[[Roadmap]]')
  })

  it('converts a human date reference to the journal day', () => {
    expect(rewrite('met on [[Apr 30th, 2025]]')).toBe('met on #[[2025-04-30]]')
  })

  it('flattens a block reference to the owning page', () => {
    expect(
      rewrite('done ((668ea540-66b3-40ba-bcd5-c29299bfbb8d))', {
        '668ea540-66b3-40ba-bcd5-c29299bfbb8d': '2024-07-10',
      }),
    ).toBe('done #[[2024-07-10]]')
  })

  it('leaves an unresolved block reference as text', () => {
    expect(rewrite('done ((668ea540-66b3-40ba-bcd5-c29299bfbb8d))')).toBe(
      'done ((668ea540-66b3-40ba-bcd5-c29299bfbb8d))',
    )
  })

  it('turns a bullet-start task keyword into a page reference', () => {
    expect(rewrite('- DONE review book')).toBe('- #DONE review book')
    expect(rewrite('  - TODO next')).toBe('  - #TODO next')
  })

  it('leaves a task keyword that is not the first token alone', () => {
    expect(rewrite('- send it LATER')).toBe('- send it LATER')
  })

  it('drops UI-only properties and keeps data properties', () => {
    const text = ['- #food', '  collapsed:: true', '  balance:: -300zl', '- DONE x'].join('\n')
    expect(rewrite(text)).toBe(['- #food', '  balance:: -300zl', '- #DONE x'].join('\n'))
  })

  it('drops the org drawer wrapper and keeps the clock line', () => {
    const text = ['- task', '  :LOGBOOK:', '  CLOCK: [2025-08-25 Mon] => 00:00:01', '  :END:'].join(
      '\n',
    )
    expect(rewrite(text)).toBe(['- task', '  CLOCK: [2025-08-25 Mon] => 00:00:01'].join('\n'))
  })

  it('rewrites relative asset paths in links and property values', () => {
    expect(rewrite('![shot](../assets/shot.png)')).toBe('![shot](assets/shot.png)')
    expect(rewrite('  file-path:: ../assets/report.pdf')).toBe('  file-path:: assets/report.pdf')
  })

  it('normalizes the target of an existing bracketed reference', () => {
    expect(rewrite('see #[[17893 High loads___parallel warning]]')).toBe(
      'see #[[17893 High loads-parallel warning]]',
    )
  })

  it('converts leading tabs to two-space indentation', () => {
    expect(rewrite('\t\t- nested')).toBe('    - nested')
  })

  it('leaves code fences and their contents untouched', () => {
    const text = ['- ```', '  [[NotARef]] #tag/slash', '  ```', '- [[Real]]'].join('\n')
    expect(rewrite(text)).toBe(
      ['- ```', '  [[NotARef]] #tag/slash', '  ```', '- #[[Real]]'].join('\n'),
    )
  })

  it('does not turn a slash tag or a URL fragment into a reference', () => {
    const text = '- #tag/with/slash see https://example.com/a.cs#L109'
    expect(rewrite(text)).toBe(text)
  })

  it('drops a title property only when it repeats the page stem', () => {
    expect(rewriteLogseqContent('title:: Note\nbody', new Map(), 'Note', emptyImportStats())).toBe(
      'body',
    )
    expect(rewriteLogseqContent('title:: Other\nbody', new Map(), 'Note', emptyImportStats())).toBe(
      'title:: Other\nbody',
    )
  })
})

/** Minimal in-memory VaultStorage for the orchestrator tests. */
class MemStorage implements VaultStorage {
  readonly files = new Map<string, string | Blob>()
  constructor(seed: Record<string, string | Blob> = {}) {
    for (const [k, v] of Object.entries(seed)) this.files.set(k, v)
  }
  async read(path: string): Promise<string> {
    const value = this.files.get(path)
    if (value === undefined) throw new Error(`missing ${path}`)
    if (value instanceof Blob) throw new Error(`binary ${path}`)
    return value
  }
  async write(path: string, content: string): Promise<void> {
    this.files.set(path, content)
  }
  async writeBinary(path: string, blob: Blob): Promise<void> {
    this.files.set(path, blob)
  }
  async readBinary(path: string): Promise<Blob> {
    const value = this.files.get(path)
    if (value === undefined) throw new Error(`missing ${path}`)
    return value instanceof Blob ? value : new Blob([value])
  }
  async delete(path: string): Promise<void> {
    this.files.delete(path)
  }
  async list(path: string): Promise<string[]> {
    const prefix = path === '' ? '' : `${path}/`
    return [...this.files.keys()].filter((k) => k.startsWith(prefix)).sort()
  }
  async stat(path: string): Promise<number> {
    if (!this.files.has(path)) throw new Error(`missing ${path}`)
    return 0
  }
}

describe('runLogseqImport', () => {
  const sourceA = () =>
    new MemStorage({
      'pages/Roadmap.md': 'A roadmap\n',
      'journals/2024_07_02.md': 'A day\n',
      'assets/shot.png': new Blob(['png']),
    })
  const sourceB = () =>
    new MemStorage({
      'pages/Roadmap.md': 'B roadmap\n',
      'journals/2024_07_02.md': 'B day\n',
      'assets/shot.png': new Blob(['png']),
    })
  const source = () =>
    new MemStorage({
      'pages/Roadmap.md': 'See [[Ideas]]\n',
      'pages/%2ENET interview.md': '#ok\n',
      'journals/2024_07_02.md': '- met [[Roadmap]]\n',
      'pages/journals/2026-09-11.md': '#saira\n',
      'assets/shot.png': new Blob(['png']),
      'draws/diagram.excalidraw': new Blob(['{}']),
      'whiteboards/board.edn': new Blob(['{}']),
      'logseq/config.edn': 'ignored',
      'logseq/bak/x.md': 'ignored',
      'pages/.folio/pins.md': 'ignored',
    })

  it('writes pages, journals, and assets under Folio paths', async () => {
    const dest = new MemStorage()
    const result = await runLogseqImport(source(), dest)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(dest.files.has('pages/Roadmap.md')).toBe(true)
    expect(dest.files.has('pages/NET interview.md')).toBe(true)
    expect(dest.files.has('journals/2024-07-02.md')).toBe(true)
    expect(dest.files.has('journals/2026-09-11.md')).toBe(true)
    expect(dest.files.has('assets/shot.png')).toBe(true)
    expect(dest.files.has('assets/diagram.excalidraw')).toBe(true)
    expect(dest.files.has('assets/board.edn')).toBe(true)
    expect(result.report.written).toBe(4)
    expect(result.report.merged).toBe(0)
    expect(result.report.assetsCopied).toBe(3)
    expect(dest.files.has('.folio/imports.md')).toBe(true)
  })

  it('never imports config, backups, or source meta', async () => {
    const dest = new MemStorage()
    await runLogseqImport(source(), dest)
    for (const path of [...dest.files.keys()]) {
      expect(path.startsWith('logseq/')).toBe(false)
      expect(path.startsWith('pages/.folio/')).toBe(false)
      if (path.startsWith('.folio/')) expect(path).toBe('.folio/imports.md')
    }
  })

  it('appends a second graph into existing pages and journals', async () => {
    const dest = new MemStorage()
    await runLogseqImport(sourceA(), dest, { sourceName: 'graph-a' })
    const result = await runLogseqImport(sourceB(), dest, { sourceName: 'graph-b' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.report.merged).toBe(2)
    expect(result.report.written).toBe(0)
    expect(dest.files.get('pages/Roadmap.md')).toBe('A roadmap\n\nB roadmap\n')
    expect(dest.files.get('journals/2024-07-02.md')).toBe('A day\n\nB day\n')
  })

  it('leaves an existing asset untouched', async () => {
    const dest = new MemStorage({ 'assets/shot.png': 'mine' })
    const result = await runLogseqImport(sourceB(), dest, { sourceName: 'graph-b' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(dest.files.get('assets/shot.png')).toBe('mine')
    expect(result.report.skipped).toBe(1)
    expect(result.report.assetsCopied).toBe(0)
  })

  it('preserves destination meta and records the imported source', async () => {
    const dest = new MemStorage({ '.folio/pins.md': 'pins' })
    const result = await runLogseqImport(sourceA(), dest, { sourceName: 'graph-a' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(dest.files.get('.folio/pins.md')).toBe('pins')
    expect(String(dest.files.get('.folio/imports.md'))).toContain('graph-a\tpages/Roadmap.md')
  })

  it('is idempotent on a second run through the ledger', async () => {
    const dest = new MemStorage()
    await runLogseqImport(sourceA(), dest, { sourceName: 'graph-a' })
    const before = [...dest.files.keys()].sort()
    const second = await runLogseqImport(sourceA(), dest, { sourceName: 'graph-a' })
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.report.written).toBe(0)
    expect(second.report.merged).toBe(0)
    expect(second.report.assetsCopied).toBe(0)
    expect(second.report.alreadyImported).toBeGreaterThan(0)
    expect([...dest.files.keys()].sort()).toEqual(before)
  })

  it('records what it wrote when a run fails part-way, so a re-run appends only the rest', async () => {
    const dest = new MemStorage()
    const write = dest.write.bind(dest)
    dest.write = async (path, content) => {
      if (path === 'journals/2024-07-02.md') throw new Error('disk full')
      await write(path, content)
    }
    const failed = await runLogseqImport(sourceA(), dest, { sourceName: 'graph-a' })
    expect(failed).toEqual({ ok: false, error: 'disk full' })
    expect(dest.files.has('pages/Roadmap.md')).toBe(true)
    expect(String(dest.files.get('.folio/imports.md'))).toContain('graph-a\tpages/Roadmap.md')

    dest.write = write
    const retry = await runLogseqImport(sourceA(), dest, { sourceName: 'graph-a' })
    expect(retry.ok).toBe(true)
    if (!retry.ok) return
    expect(retry.report.alreadyImported).toBe(1)
    expect(retry.report.written).toBe(1)
    expect(retry.report.merged).toBe(0)
    expect(dest.files.get('pages/Roadmap.md')).toBe('A roadmap\n')
  })

  it('reports progress through scanning and writing', async () => {
    const seen: ImportProgress[] = []
    await runLogseqImport(source(), new MemStorage(), {
      onProgress: (p) => seen.push(p),
    })
    expect(seen[0].phase).toBe('scanning')
    expect(seen.some((p) => p.phase === 'writing')).toBe(true)
    const last = seen[seen.length - 1]
    expect(last.done).toBe(last.total)
  })

  it('reports a failure instead of throwing', async () => {
    const dest = new MemStorage()
    dest.write = async () => {
      throw new Error('disk full')
    }
    const result = await runLogseqImport(source(), dest)
    expect(result).toEqual({ ok: false, error: 'disk full' })
  })
})
