import { describe, expect, it } from 'vitest'
import { InvalidVaultPathError } from '../vault/fs'
import { DemoVaultStorage } from './storage'

describe('DemoVaultStorage', () => {
  it('reads seeded text and lists every file under a path, sorted', async () => {
    const storage = new DemoVaultStorage({
      'pages/b.md': 'bee',
      'pages/a.md': 'aye',
      'assets/chart.svg': '<svg/>',
    })
    expect(await storage.read('pages/a.md')).toBe('aye')
    expect(await storage.list('')).toEqual(['assets/chart.svg', 'pages/a.md', 'pages/b.md'])
    expect(await storage.list('pages')).toEqual(['pages/a.md', 'pages/b.md'])
    expect(await storage.list('nowhere')).toEqual([])
  })

  it('rejects a missing file and an invalid path', async () => {
    const storage = new DemoVaultStorage({ 'pages/a.md': 'aye' })
    await expect(storage.read('pages/missing.md')).rejects.toThrow('File not found')
    await expect(storage.read('/absolute.md')).rejects.toThrow(InvalidVaultPathError)
    await expect(storage.write('../escape.md', 'x')).rejects.toThrow(InvalidVaultPathError)
    expect(() => new DemoVaultStorage({ 'a/../b.md': 'x' })).toThrow(InvalidVaultPathError)
  })

  it('writes text and binary, and every write moves the mtime forward', async () => {
    const storage = new DemoVaultStorage({ 'pages/a.md': 'first' })
    const before = await storage.stat('pages/a.md')
    await storage.write('pages/a.md', 'second')
    const afterText = await storage.stat('pages/a.md')
    expect(await storage.read('pages/a.md')).toBe('second')
    expect(afterText).toBeGreaterThan(before)

    await storage.writeBinary('assets/note.bin', new Blob(['bytes']))
    const afterBinary = await storage.stat('assets/note.bin')
    expect(afterBinary).toBeGreaterThan(afterText)
    expect(await (await storage.readBinary('assets/note.bin')).text()).toBe('bytes')
    expect(await storage.list('assets')).toEqual(['assets/note.bin'])
  })

  it('serves a seeded string as text bytes', async () => {
    const storage = new DemoVaultStorage({ 'assets/note.txt': 'hello' })
    const blob = await storage.readBinary('assets/note.txt')
    expect(await blob.text()).toBe('hello')
  })
})
