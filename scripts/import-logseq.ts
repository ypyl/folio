// One-shot Logseq import, run from the terminal instead of the app
// (move-the-logseq-import-to-a-script). The transform is the app's own
// `runLogseqImport`; this file only supplies a VaultStorage over node:fs and a
// small CLI around it.
//
//   npm run import:logseq -- <logseq-folder> <folio-vault>
//
// The source is read only. The destination is created when missing, and its
// `.folio/imports.md` ledger means a re-run appends only fresh sources.

import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parsePath } from '../src/vault/fs'
import { runLogseqImport, type ImportReport } from '../src/vault/logseqImport'
import type { VaultStorage } from '../src/vault/storage'

/** A VaultStorage over a directory on disk, under the ADR-0013 path contract:
 *  vault-relative POSIX paths, validated by the same `parsePath` the browser
 *  adapter uses, resolved under the root. The source is never written by the
 *  transform; the methods exist to satisfy the seam. */
export class NodeVaultStorage implements VaultStorage {
  private readonly root: string

  constructor(root: string) {
    this.root = resolve(root)
  }

  /** Resolve a file path, refusing the root and anything outside it. */
  private file(path: string): string {
    const parts = parsePath(path)
    if (parts.length === 0) throw new Error('A file path is required')
    const full = join(this.root, ...parts)
    const fromRoot = relative(this.root, full)
    if (fromRoot === '' || fromRoot.startsWith('..')) {
      throw new Error(`Path escapes the folder: ${path}`)
    }
    return full
  }

  async read(path: string): Promise<string> {
    return readFile(this.file(path), 'utf8')
  }

  async write(path: string, content: string): Promise<void> {
    const full = this.file(path)
    await mkdir(dirname(full), { recursive: true })
    await writeFile(full, content, 'utf8')
  }

  async readBinary(path: string): Promise<Blob> {
    return new Blob([new Uint8Array(await readFile(this.file(path)))])
  }

  async writeBinary(path: string, blob: Blob): Promise<void> {
    const full = this.file(path)
    await mkdir(dirname(full), { recursive: true })
    await writeFile(full, Buffer.from(await blob.arrayBuffer()))
  }

  async list(path: string): Promise<string[]> {
    const parts = parsePath(path)
    const start = parts.length === 0 ? this.root : join(this.root, ...parts)
    const found: string[] = []
    const walk = async (current: string, prefix: string): Promise<void> => {
      for (const entry of await readdir(current, { withFileTypes: true })) {
        if (entry.isDirectory()) await walk(join(current, entry.name), `${prefix}${entry.name}/`)
        else if (entry.isFile()) found.push(`${prefix}${entry.name}`)
      }
    }
    await walk(start, '')
    return found.sort()
  }

  async stat(path: string): Promise<number> {
    return (await stat(this.file(path))).mtimeMs
  }

  async remove(path: string): Promise<void> {
    await rm(this.file(path))
  }
}

/** Run one import into `destinationDir`, creating it when missing. Resolves
 *  with the transform's report; throws with its error on failure. */
export async function importLogseq(
  sourceDir: string,
  destinationDir: string,
): Promise<ImportReport> {
  const sourceRoot = resolve(sourceDir)
  const destRoot = resolve(destinationDir)
  if (sourceRoot === destRoot) {
    throw new Error('The source and destination must be different folders')
  }
  const info = await stat(sourceRoot).catch(() => null)
  if (info === null || !info.isDirectory()) {
    throw new Error(`The source folder does not exist: ${sourceRoot}`)
  }
  await mkdir(destRoot, { recursive: true })
  const result = await runLogseqImport(
    new NodeVaultStorage(sourceRoot),
    new NodeVaultStorage(destRoot),
    {
      sourceName: basename(sourceRoot),
    },
  )
  if (!result.ok) throw new Error(result.error)
  return result.report
}

const USAGE = 'Usage: npm run import:logseq -- <logseq-folder> <folio-vault>'

async function main(argv: string[]): Promise<number> {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(USAGE)
    return 0
  }
  const [source, destination] = argv
  if (source === undefined || destination === undefined || argv.length > 2) {
    console.error(USAGE)
    return 2
  }
  try {
    console.log(`Importing ${resolve(source)} into ${resolve(destination)}`)
    const report = await importLogseq(source, destination)
    console.log('')
    console.log(`Files written: ${report.written}`)
    console.log(`Files merged into existing: ${report.merged}`)
    console.log(`Assets copied: ${report.assetsCopied}`)
    console.log(`Assets skipped (already there): ${report.skipped}`)
    console.log(`Source files already imported: ${report.alreadyImported}`)
    if (report.collisions.length > 0) {
      console.log(`Name collisions (first kept): ${report.collisions.join(', ')}`)
    }
    console.log('')
    console.log('Done. Open the destination folder in Folio.')
    return 0
  } catch (error) {
    console.error(`Import failed: ${error instanceof Error ? error.message : String(error)}`)
    return 1
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main(process.argv.slice(2)).then((code) => process.exit(code))
}
