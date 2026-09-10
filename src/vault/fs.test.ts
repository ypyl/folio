import { describe, expect, it, vi } from 'vitest'
import { FileSystemVaultStorage, InvalidVaultPathError, parsePath, pickVaultFolder } from './fs'
import { buildTree, type FakeDirectoryHandle, type FakeTreeNode } from './fakeHandle'

// Fake handle tree lives in fakeHandle.ts (shared with useVault.test.ts);
// this suite exercises the storage against it (D5). Cast into place: the
// impl types against the real DOM types, the fake implements exactly the
// calls the impl makes.
// ponytail: fake mirrors FSA failure modes (NotFoundError/TypeMismatchError)
// for the calls the impl depends on; e2e in task 6 is the real-API backstop.

function fakeVault(tree: FakeTreeNode): FileSystemVaultStorage {
  const root = buildTree(tree)
  return new FileSystemVaultStorage(root as unknown as FileSystemDirectoryHandle)
}

const VAULT = {
  'welcome.md': '# Welcome',
  journals: {
    '2026.md': 'year',
    deep: { 'x.md': 'x' },
  },
  'tags.md': '#tag',
}

describe('parsePath', () => {
  it('maps root to []', () => {
    expect(parsePath('')).toEqual([])
  })
  it.each(['/lead.slash', 'a/../b', 'a/.', './a', 'a//b', 'a/', '..'])('rejects %s', (path) => {
    expect(() => parsePath(path)).toThrow(InvalidVaultPathError)
  })
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

  it('writes binary blobs byte-for-byte with missing parent dirs created', async () => {
    const root = buildTree(VAULT)
    const vault = new FileSystemVaultStorage(root as unknown as FileSystemDirectoryHandle)
    const blob = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' })
    await vault.writeBinary('assets/photo.png', blob)
    expect(await vault.list('')).toContain('assets/photo.png')
    // Byte-exact check goes through the handle (the text read decodes UTF-8, so
    // arbitrary binary never round-trips the text path — by design, ADR-0001).
    const assetsDir = root.children.get('assets') as FakeDirectoryHandle
    const file = assetsDir.children.get('photo.png') as unknown as { getFile: () => Promise<File> }
    const bytes = new Uint8Array(await (await file.getFile()).arrayBuffer())
    expect([...bytes]).toEqual([137, 80, 78, 71])
  })

  it('writeBinary replaces the file at the given path', async () => {
    const vault = fakeVault(VAULT)
    await vault.writeBinary('assets/photo.png', new Blob(['v2']))
    await expect(vault.read('assets/photo.png')).resolves.toBe('v2')
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
    await expect(fakeVault({ empty: {} }).list('empty')).resolves.toEqual([])
  })

  it('rejects listing a missing directory', async () => {
    await expect(fakeVault(VAULT).list('nope')).rejects.toMatchObject({
      name: 'NotFoundError',
    })
  })

  it('rejects listing a file path', async () => {
    await expect(fakeVault(VAULT).list('welcome.md')).rejects.toMatchObject({
      name: 'TypeMismatchError',
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
      op === 'read' ? vault.read('') : op === 'write' ? vault.write('', 'x') : vault.delete('')
    await expect(call).rejects.toBeInstanceOf(InvalidVaultPathError)
  })
})

describe('pickVaultFolder', () => {
  it('resolves with the picked folder handle', async () => {
    const picked = buildTree(VAULT)
    vi.stubGlobal(
      'showDirectoryPicker',
      vi.fn(async () => picked as unknown as FileSystemDirectoryHandle),
    )
    try {
      const root = await pickVaultFolder()
      expect(root).toBe(picked as unknown as FileSystemDirectoryHandle)
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
