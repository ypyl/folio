// Shared test-support fake of the File System Access handle subset both the
// storage and the vault hook use (D4/D5 of build-fsa-storage and
// build-open-folder-flow). Implements exactly the surface the impl depends on:
// the storage calls (getFileHandle/getDirectoryHandle/entries/removeEntry/
// createWritable) plus the permission API (queryPermission/requestPermission)
// with a settable, per-instance state. Cast into the DOM types at call sites.

export type FakeTreeNode = string | { [name: string]: FakeTreeNode }

// Deterministic fake mtime: strictly increases on every write, so refresh
// diff tests can rely on changed files always being detected (task 2.5).
let fakeMtime = 1

function nextMtime(): number {
  return fakeMtime++
}

export class FakeFileHandle {
  readonly kind = 'file'
  readonly name: string
  private content: string | Blob
  lastModified: number

  constructor(
    name: string,
    content: string | Blob = '',
  ) {
    this.name = name
    this.content = content
    this.lastModified = nextMtime()
  }

  async writeContent(content: string | Blob): Promise<void> {
    this.content = content
    this.lastModified = nextMtime()
  }

  async getFile(): Promise<File> {
    return new File([this.content], this.name, { lastModified: this.lastModified })
  }

  async createWritable(): Promise<FakeWritableStream> {
    return new FakeWritableStream(this)
  }
}

class FakeWritableStream {
  private readonly file: FakeFileHandle

  constructor(file: FakeFileHandle) {
    this.file = file
  }

  async write(content: string | Blob): Promise<void> {
    await this.file.writeContent(content)
  }
  async close(): Promise<void> {}
}

export class FakeDirectoryHandle {
  readonly kind = 'directory'
  name: string
  readonly children = new Map<string, FakeFileHandle | FakeDirectoryHandle>()
  permission: PermissionState = 'granted'
  // Test-assigned identity so isSameEntry can dedup re-picks (D1).
  _id?: string

  constructor(name = '', id?: string) {
    this.name = name
    this._id = id
  }

  async isSameEntry(other: FileSystemHandle): Promise<boolean> {
    const o = other as FakeDirectoryHandle
    return !!(o._id && this._id && o._id === this._id)
  }

  async queryPermission(): Promise<PermissionState> {
    return this.permission
  }

  // Mirror Chromium: a previously picked folder auto-grants on request;
  // a denied one stays denied (re-requesting needs a fresh pick).
  async requestPermission(): Promise<PermissionState> {
    return this.permission === 'prompt' ? 'granted' : this.permission
  }

  async getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle> {
    const child = this.children.get(name)
    if (child instanceof FakeDirectoryHandle) {
      throw new DOMException('Path is a directory', 'TypeMismatchError')
    }
    if (child) return child as unknown as FileSystemFileHandle
    if (options?.create) {
      const file = new FakeFileHandle(name, '')
      this.children.set(name, file)
      return file as unknown as FileSystemFileHandle
    }
    throw new DOMException('File not found', 'NotFoundError')
  }

  async getDirectoryHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<FileSystemDirectoryHandle> {
    const child = this.children.get(name)
    if (child instanceof FakeFileHandle) {
      throw new DOMException('Path is a file', 'TypeMismatchError')
    }
    if (child) return child as unknown as FileSystemDirectoryHandle
    if (options?.create) {
      const dir = new FakeDirectoryHandle(name)
      this.children.set(name, dir)
      return dir as unknown as FileSystemDirectoryHandle
    }
    throw new DOMException('Directory not found', 'NotFoundError')
  }

  /** Manual variant of the DOM's `entries()` (the DOM version needs no `dir` arg). */
  async *entries(): AsyncGenerator<[string, FakeFileHandle | FakeDirectoryHandle]> {
    for (const [name, child] of this.children) yield [name, child]
  }

  async removeEntry(name: string): Promise<void> {
    if (!this.children.delete(name)) {
      throw new DOMException('Entry not found', 'NotFoundError')
    }
  }
}

export function buildTree(
  node: FakeTreeNode,
  dir = new FakeDirectoryHandle(),
): FakeDirectoryHandle {
  if (typeof node === 'string') throw new Error('root must be a directory')
  for (const [name, child] of Object.entries(node)) {
    if (typeof child === 'string') {
      dir.children.set(name, new FakeFileHandle(name, child))
    } else {
      const sub = new FakeDirectoryHandle(name)
      buildTree(child, sub)
      dir.children.set(name, sub)
    }
  }
  return dir
}