// The import script (move-the-logseq-import-to-a-script): the Node VaultStorage
// and the transform wired to a real temporary directory. The transform's own
// rules are covered by logseqImport.test.ts; this holds the adapter, the ledger
// across two runs, and the source staying untouched.

import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { importLogseq } from '../../scripts/import-logseq'

let root: string
let source: string
let destination: string

/** Every file under `dir` with its bytes, for an untouched-tree check. */
async function snapshot(dir: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {}
  const walk = async (current: string, prefix: string): Promise<void> => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = `${prefix}${entry.name}`
      if (entry.isDirectory()) await walk(join(current, entry.name), `${path}/`)
      else files[path] = (await readFile(join(current, entry.name))).toString('base64')
    }
  }
  await walk(dir, '')
  return files
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'folio-logseq-'))
  source = join(root, 'logseq')
  destination = join(root, 'folio')
  await mkdir(join(source, 'pages'), { recursive: true })
  await mkdir(join(source, 'journals'), { recursive: true })
  await mkdir(join(source, 'assets'), { recursive: true })
  await writeFile(join(source, 'pages', 'Ideas.md'), 'See [[Roadmap]].\n\n- TODO write it\n')
  await writeFile(join(source, 'pages', 'Roadmap.md'), 'Plan\n')
  await writeFile(join(source, 'journals', '2024_07_02.md'), '- met a person\n')
  await writeFile(join(source, 'assets', 'shot.png'), Buffer.from([1, 2, 3]))
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('the Logseq import script', () => {
  it('writes a Folio vault, copies the asset, and records the sources', async () => {
    const report = await importLogseq(source, destination)

    expect(report.written).toBe(3)
    expect(report.assetsCopied).toBe(1)
    expect(report.merged).toBe(0)

    const page = await readFile(join(destination, 'pages', 'Ideas.md'), 'utf8')
    expect(page).toContain('#[[Roadmap]]')
    expect(await readFile(join(destination, 'pages', 'Roadmap.md'), 'utf8')).toContain('Plan')
    expect(await readFile(join(destination, 'journals', '2024-07-02.md'), 'utf8')).toContain(
      'met a person',
    )
    expect((await stat(join(destination, 'assets', 'shot.png'))).isFile()).toBe(true)

    const ledger = await readFile(join(destination, '.folio', 'imports.md'), 'utf8')
    expect(ledger).toContain('pages/Ideas.md')
    expect(ledger).toContain('journals/2024_07_02.md')
  })

  it('leaves the source untouched and appends nothing on a second run', async () => {
    const before = await snapshot(source)
    await importLogseq(source, destination)
    const second = await importLogseq(source, destination)

    expect(second.alreadyImported).toBe(3)
    expect(second.written).toBe(0)
    expect(second.merged).toBe(0)
    expect(second.assetsCopied).toBe(0)
    expect(await snapshot(source)).toEqual(before)
  })

  it('refuses the same folder as both source and destination', async () => {
    await expect(importLogseq(source, source)).rejects.toThrow(/different folders/)
  })

  it('refuses a source that is not there', async () => {
    await expect(importLogseq(join(root, 'missing'), destination)).rejects.toThrow(/does not exist/)
  })
})
