import { describe, expect, it } from 'vitest'
import { FileSystemVaultStorage } from './fs'
import { buildTree, type FakeTreeNode } from './fakeHandle'
import { copyDroppedFiles } from './assets'
import type { VaultStorage } from './storage'

function vault(tree: FakeTreeNode): FileSystemVaultStorage {
  return new FileSystemVaultStorage(buildTree(tree) as unknown as FileSystemDirectoryHandle)
}

const file = (name: string): File =>
  new File([new Uint8Array(4)], name, { type: 'application/octet-stream' })

describe('copyDroppedFiles', () => {
  it('copies a first file under its own name and returns its path', async () => {
    const storage = vault({})
    const landed = await copyDroppedFiles(storage, [file('photo.png')])
    expect(landed).toEqual(['assets/photo.png'])
    expect(await storage.list('')).toContain('assets/photo.png')
  })

  it('numbers a colliding name with -1 (scenario: never overwrite)', async () => {
    const storage = vault({ assets: { 'photo.png': 'x' } })
    const landed = await copyDroppedFiles(storage, [file('photo.png')])
    expect(landed).toEqual(['assets/photo-1.png'])
    expect(await storage.list('assets')).toEqual(['assets/photo-1.png', 'assets/photo.png'])
  })

  it('gives same-batch duplicates distinct names', async () => {
    const storage = vault({})
    const landed = await copyDroppedFiles(storage, [file('a.png'), file('a.png'), file('a.png')])
    expect(landed).toEqual(['assets/a.png', 'assets/a-1.png', 'assets/a-2.png'])
  })

  it('omits a failed copy but still lands the others', async () => {
    const storage = vault({}) as unknown as {
      writeBinary: (p: string, b: Blob) => Promise<void>
      list: (p: string) => Promise<string[]>
    }
    let calls = 0
    const original = storage.writeBinary.bind(storage)
    storage.writeBinary = async (p, b) => {
      calls += 1
      if (calls === 2) throw new Error('boom')
      await original(p, b)
    }
    const landed = await copyDroppedFiles(storage as VaultStorage, [file('x.png'), file('y.png')])
    expect(landed).toEqual(['assets/x.png'])
    expect(await storage.list('')).not.toContain('assets/y.png')
  })
})
