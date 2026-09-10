import type { VaultStorage } from './storage'

// 'showDirectoryPicker' was removed from lib.dom in TS 6; declare the one
// member the picker factory needs (Chromium implements the full API).
declare function showDirectoryPicker(options?: {
  mode?: 'read' | 'readwrite'
}): Promise<FileSystemDirectoryHandle>

// File System Access transport for the VaultStorage seam (ADR-0002, ADR-0013).
// FSA resolves paths one segment at a time: getFileHandle/getDirectoryHandle
// take a single name, so every operation walks the path first (D3).

/** Rejects a path that violates the ADR-0013 path contract. Never sanitized. */
export class InvalidVaultPathError extends Error {
  readonly path: string

  constructor(path: string) {
    super(`Invalid vault path: ${path === '' ? '<root>' : path}`)
    this.name = 'InvalidVaultPathError'
    this.path = path
  }
}

/**
 * Split a contract path into segments. '' denotes the root and yields [].
 * Rejects: leading '/', absolute forms, and empty/'.'/'..' segments.
 */
export function parsePath(path: string): string[] {
  if (path === '') return []
  if (path.startsWith('/')) throw new InvalidVaultPathError(path)
  const segments = path.split('/')
  for (const segment of segments) {
    if (segment === '' || segment === '.' || segment === '..') {
      throw new InvalidVaultPathError(path)
    }
  }
  return segments
}

/** parsePath for a path that must name a file: the vault root is a directory,
 *  so a root path (no segments) is invalid (ADR-0013). */
function parseFilePath(path: string): string[] {
  const segments = parsePath(path)
  if (segments.length === 0) throw new InvalidVaultPathError(path)
  return segments
}

/**
 * VaultStorage over a FileSystemDirectoryHandle. Assumes a granted handle
 * (D2): the picker grants readwrite for the session, and reload-restore
 * permission negotiation belongs to the caller (task 5), not here.
 */
export class FileSystemVaultStorage implements VaultStorage {
  /** The underlying Chrome handle. */
  private readonly root: FileSystemDirectoryHandle

  constructor(root: FileSystemDirectoryHandle) {
    this.root = root
  }
  async read(path: string): Promise<string> {
    const segments = parseFilePath(path)
    const parent = await this.resolveDir(segments.slice(0, -1))
    const file = await parent.getFileHandle(lastSegment(segments))
    return (await file.getFile()).text()
  }

  async write(path: string, content: string): Promise<void> {
    await this.writeFile(path, content)
  }

  async writeBinary(path: string, blob: Blob): Promise<void> {
    await this.writeFile(path, blob)
  }

  /** Create or overwrite the file at `path` with text or raw bytes. */
  private async writeFile(path: string, data: string | Blob): Promise<void> {
    const segments = parseFilePath(path)
    const parent = await this.resolveDir(segments.slice(0, -1), { create: true })
    const file = await parent.getFileHandle(lastSegment(segments), { create: true })
    const writable = await file.createWritable()
    await writable.write(data)
    await writable.close()
  }

  async delete(path: string): Promise<void> {
    const segments = parseFilePath(path)
    const parent = await this.resolveDir(segments.slice(0, -1))
    await parent.removeEntry(lastSegment(segments), { recursive: true })
  }

  async list(path: string): Promise<string[]> {
    const segments = parsePath(path)
    const dir = await this.resolveDir(segments)
    const prefix = path === '' ? '' : path + '/'
    const files: string[] = []
    await walk(dir, prefix)
    return files.sort() // FSA child order is not a stable contract (D4)

    async function walk(current: FileSystemDirectoryHandle, prefix: string): Promise<void> {
      for await (const [name, handle] of current.entries()) {
        if (handle.kind === 'file') files.push(prefix + name)
        else await walk(handle, prefix + name + '/')
      }
    }
  }

  async stat(path: string): Promise<number> {
    const segments = parseFilePath(path)
    const parent = await this.resolveDir(segments.slice(0, -1))
    const file = await parent.getFileHandle(lastSegment(segments))
    return (await file.getFile()).lastModified
  }

  private async resolveDir(
    segments: string[],
    options?: { create: boolean },
  ): Promise<FileSystemDirectoryHandle> {
    let dir = this.root
    for (const segment of segments) {
      dir = await dir.getDirectoryHandle(segment, options)
    }
    return dir
  }
}

function lastSegment(segments: string[]): string {
  return segments[segments.length - 1]
}

/** Open the OS directory picker with readwrite access; resolves with the
 *  chosen folder handle, which becomes the vault. */
export async function pickVaultFolder(): Promise<FileSystemDirectoryHandle> {
  return showDirectoryPicker({ mode: 'readwrite' })
}
