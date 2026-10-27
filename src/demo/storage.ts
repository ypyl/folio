import type { VaultStorage } from '../vault/storage'
import { parsePath } from '../vault/fs'

// The guided demo's transport (add-guided-demo, ADR-0034): a VaultStorage over
// an in-memory file map. Everything the app already knows how to do - scan,
// save, links, pins, reminders, boards, dropped files - runs unchanged against
// it, and no call can reach a real folder because no folder handle exists here.
// The seed is constructed by the composition layer only when the user opens the
// demo, so a real vault never pays for it (design D1/D9).

/** One file's bytes and the mtime the index diffs on. */
type Entry = {
  content: string | Blob
  lastModified: number
}

export class DemoVaultStorage implements VaultStorage {
  private readonly files: Map<string, Entry>
  /** A logical clock, so every write is newer than the last one without asking
   *  the wall clock, which two writes in one millisecond could tie. */
  private clock = 0

  constructor(seed: Readonly<Record<string, string | Blob>> = {}) {
    this.files = new Map()
    for (const [path, content] of Object.entries(seed)) {
      parsePath(path) // the same ADR-0013 contract a real vault enforces
      this.files.set(path, { content, lastModified: ++this.clock })
    }
  }

  async read(path: string): Promise<string> {
    const entry = this.entry(path)
    return typeof entry.content === 'string' ? entry.content : await entry.content.text()
  }

  async write(path: string, content: string): Promise<void> {
    this.put(path, content)
  }

  async writeBinary(path: string, blob: Blob): Promise<void> {
    this.put(path, blob)
  }

  async readBinary(path: string): Promise<Blob> {
    const entry = this.entry(path)
    return typeof entry.content === 'string'
      ? new Blob([entry.content], { type: 'text/plain' })
      : entry.content
  }

  async list(path: string): Promise<string[]> {
    const segments = parsePath(path)
    const prefix = segments.join('/')
    const start = prefix === '' ? '' : `${prefix}/`
    const paths: string[] = []
    for (const key of this.files.keys()) {
      if (key.startsWith(start)) paths.push(key)
    }
    return paths.sort()
  }

  async stat(path: string): Promise<number> {
    return this.entry(path).lastModified
  }

  /** The file at `path`, or a rejection that mirrors a real storage's missing
   *  file. Directories are implicit: a path with files beneath it is a folder. */
  private entry(path: string): Entry {
    parsePath(path)
    const entry = this.files.get(path)
    if (entry === undefined) throw new Error(`File not found: ${path}`)
    return entry
  }

  private put(path: string, content: string | Blob): void {
    parsePath(path)
    this.files.set(path, { content, lastModified: ++this.clock })
  }
}
