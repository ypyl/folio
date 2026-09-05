import { describe, expect, it, vi } from 'vitest'
import {
  FileSystemVaultStorage,
  InvalidVaultPathError,
  parsePath,
  pickVaultFolder,
} from './fs'

// In-memory fake of the File System Access handle subset the storage uses
// (D5). Cast into place: the impl types against the real DOM types, the fake
// implements exactly the calls the impl makes.
// ponytail: fake mirrors FSA failure modes (NotFoundError/TypeMismatchError)
// for the calls the impl depends on; e2e in task 6 is the real-API backstop.

type TreeNode = string | { [name: string]: TreeNode }

class FakeFileHandle {
  readonly kind = 'file'
  readonly name: string
  private content: string

  constructor(
    name: string,
    content: string,
  ) {
    this.name = name
    this.content = content
  }

  async writeContent(content: string): Promise<void> {
    this.content = content
  }

  async getFile(): Promise<File> {
    return new File([this.content], this.name)
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

  async write(content: string): Promise<void> {
    await this.file.writeContent(content)
  }
  async close(): Promise<void> {}
}

class FakeDirectoryHandle {
  readonly kind = 'directory'
  readonly children = new Map<string, FakeFileHandle | FakeDirectoryHandle>()

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
      const dir = new FakeDirectoryHandle()
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

function buildTree(node: TreeNode, dir = new FakeDirectoryHandle()): FakeDirectoryHandle {
  if (typeof node === 'string') throw new Error('root must be a directory')
  for (const [name, child] of Object.entries(node)) {
    if (typeof child === 'string') {
      dir.children.set(name, new FakeFileHandle(name, child))
    } else {
      const sub = new FakeDirectoryHandle()
      buildTree(child, sub)
      dir.children.set(name, sub)
    }
  }
  return dir
}

function fakeVault(tree: TreeNode): FileSystemVaultStorage {
  const root = buildTree(tree)
  return new FileSystemVaultStorage(root as unknown as FileSystemDirectoryHandle)
}

const VAULT = {
  'welcome.md': '# Welcome',
  'journals': {
    '2026.md': 'year',
    'deep': { 'x.md': 'x' },
  },
  'tags.md': '#tag',
}

describe('parsePath', () => {
  it('maps root to []', () => {
    expect(parsePath('')).toEqual([])
  })
  it.each(['/lead.slash', 'a/../b', 'a/.', './a', 'a//b', 'a/', '..'])(
    'rejects %s',
    (path) => {
      expect(() => parsePath(path)).toThrow(InvalidVaultPathError)
    },
  )
})

describe('FileSystemVaultStorage', () => {
  it('reads the content of an existing file', async () => {
    await expect(fakeVault(VAULT).read('welcome.md')).resolves.toBe('# Welcome')
  })

  it('reads nested files', async () => {
    await expect(fakeVault(VAULT).read('journals/deep/x.md')).resolves.toBe('x')
  })

  it('rejects reading a missing file', async () => {
    await expect(fakeVault(VAULT).read('nope.md')).rejects.toMatchObject({
      name: 'NotFoundError',
    })
  })

  it('rejects reading a directory', async () => {
    await expect(fakeVault(VAULT).read('journals')).rejects.toMatchObject({
      name: 'TypeMismatchError',
    })
  })

  it('rejects reading the root', async () => {
    await expect(fakeVault(VAULT).read('')).rejects.toBeInstanceOf(InvalidVaultPathError)
  })

  it('writes a new file', async () => {
    const vault = fakeVault(VAULT)
    await vault.write('new.md', 'new')
    await expect(vault.read('new.md')).resolves.toBe('new')
  })

  it('writes create missing parent directories', async () => {
    const vault = fakeVault(VAULT)
    await vault.write('a/b/c.md', 'c')
    expect(await vault.list('')).toContain('a/b/c.md')
    await expect(vault.read('a/b/c.md')).resolves.toBe('c')
  })

  it('overwrites an existing file', async () => {
    const vault = fakeVault(VAULT)
    await vault.write('welcome.md', 'v2')
    await expect(vault.read('welcome.md')).resolves.toBe('v2')
  })

  it('deletes a file', async () => {
    const vault = fakeVault(VAULT)
    await vault.delete('tags.md')
    await expect(vault.read('tags.md')).rejects.toMatchObject({ name: 'NotFoundError' })
    expect(await vault.list('')).not.toContain('tags.md')
  })

  it('deletes a directory recursively', async () => {
    const vault = fakeVault(VAULT)
    await vault.delete('journals')
    expect(await vault.list('')).not.toContain('journals/2026.md')
    expect(await vault.list('')).not.toContain('journals/deep/x.md')
  })

  it('rejects deleting a missing path', async () => {
    await expect(fakeVault(VAULT).delete('nope')).rejects.toMatchObject({
      name: 'NotFoundError',
    })
  })

  it('lists root: flat, files only, sorted', async () => {
    await expect(fakeVault(VAULT).list('')).resolves.toEqual([
      'journals/2026.md',
      'journals/deep/x.md',
      'tags.md',
      'welcome.md',
    ])
  })

  it('lists a subdirectory with root-relative paths', async () => {
    await expect(fakeVault(VAULT).list('journals')).resolves.toEqual([
      'journals/2026.md',
      'journals/deep/x.md',
    ])
  })

  it('lists an empty directory as []', async () => {
    await expect(fakeVault({ 'empty': {} }).list('empty')).resolves.toEqual([])
  })

  it('rejects listing a missing directory', async () => {
    await expect(fakeVault(VAULT).list('nope')).rejects.toMatchObject({
      name: 'NotFoundError',
    })
  })

  it.each(['/lead', 'a/../b', '../x', 'a//b', 'a/', '.', '..', '/'])(
    'rejects invalid path %s on every operation',
    async (path) => {
      const vault = fakeVault(VAULT)
      await expect(vault.read(path)).rejects.toBeInstanceOf(InvalidVaultPathError)
      await expect(vault.write(path, 'x')).rejects.toBeInstanceOf(InvalidVaultPathError)
      await expect(vault.delete(path)).rejects.toBeInstanceOf(InvalidVaultPathError)
      await expect(vault.list(path)).rejects.toBeInstanceOf(InvalidVaultPathError)
    },
  )

  it.each(['read', 'write', 'delete'] as const)('rejects %s of the root', async (op) => {
    const vault = fakeVault(VAULT)
    const call =
      op === 'read'
        ? vault.read('')
        : op === 'write'
          ? vault.write('', 'x')
          : vault.delete('')
    await expect(call).rejects.toBeInstanceOf(InvalidVaultPathError)
  })
})

describe('pickVaultFolder', () => {
  it('returns a storage bound to the picked folder', async () => {
    const root = buildTree(VAULT)
    vi.stubGlobal(
      'showDirectoryPicker',
      vi.fn(async () => root as unknown as FileSystemDirectoryHandle),
    )
    try {
      const vault = await pickVaultFolder()
      await expect(vault.read('welcome.md')).resolves.toBe('# Welcome')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('rejects when the picker is cancelled', async () => {
    vi.stubGlobal(
      'showDirectoryPicker',
      vi.fn(async () => {
        throw new DOMException('The user aborted a request.', 'AbortError')
      }),
    )
    try {
      await expect(pickVaultFolder()).rejects.toMatchObject({ name: 'AbortError' })
    } finally {
      vi.unstubAllGlobals()
    }
  })
})