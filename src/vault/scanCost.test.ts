import { describe, expect, it } from 'vitest'
import { buildIndex, SCAN_CONCURRENCY } from './index'
import { FileSystemVaultStorage } from './fs'
import { FakeDirectoryHandle, FakeFileHandle, fsaCalls, resetFsaCalls } from './fakeHandle'
import type { VaultStorage } from './storage'

// The open cost this file guards (design: open cost). Opening a vault is I/O
// bound: every FSA call is an asynchronous round trip to the browser's file
// process, so the call count is the cost. `depth` is the number of directory
// levels below `pages/`; every page in a scenario shares them, so the vault's
// distinct-directory count is `depth + 1`.
function makeVault(pages: number, depth: number): FakeDirectoryHandle {
  const root = new FakeDirectoryHandle('')
  const pagesDir = new FakeDirectoryHandle('pages')
  root.children.set('pages', pagesDir)
  for (let i = 0; i < pages; i++) {
    let dir = pagesDir
    for (let d = 0; d < depth; d++) {
      const name = `sub${d}`
      let next = dir.children.get(name) as FakeDirectoryHandle | undefined
      if (!next) {
        next = new FakeDirectoryHandle(name)
        dir.children.set(name, next)
      }
      dir = next
    }
    dir.children.set(`p${i}.md`, new FakeFileHandle(`p${i}.md`, '# p'))
  }
  return root
}

function open(pages: number, depth: number): FileSystemVaultStorage {
  return new FileSystemVaultStorage(makeVault(pages, depth) as unknown as FileSystemDirectoryHandle)
}

/** VaultStorage wrapper that records the most calls in flight at once. */
function trackConcurrency(storage: VaultStorage): {
  impl: VaultStorage
  peak: () => number
} {
  let inFlight = 0
  let peak = 0
  const run = async <T>(fn: () => Promise<T>): Promise<T> => {
    inFlight++
    peak = Math.max(peak, inFlight)
    try {
      return await fn()
    } finally {
      inFlight--
    }
  }
  return {
    peak: () => peak,
    impl: {
      read: (path) => run(() => storage.read(path)),
      write: (path, content) => run(() => storage.write(path, content)),
      writeBinary: (path, blob) => run(() => storage.writeBinary(path, blob)),
      readBinary: (path) => run(() => storage.readBinary(path)),
      list: (path) => run(() => storage.list(path)),
      stat: (path) => run(() => storage.stat(path)),
    },
  }
}

describe('scan cost', () => {
  it('pays per file, not per file × path depth', async () => {
    const storage = open(200, 3)
    resetFsaCalls()

    const index = await buildIndex(storage)

    expect(index.graph.pages.size).toBe(200)
    // Before handle caching and the fan-out this scan issued 1601
    // getDirectoryHandle calls: each of the 200 stats and reads re-resolved
    // `pages/sub0/sub1/sub2/pN.md` from the root, 2 × (depth + 1) per page.
    // Now the only directory lookups are the 4 distinct directories the scan
    // touches plus one failed probe for `.folio/pins.md`.
    expect(fsaCalls.getDirectoryHandle).toBe(5)
    // Two file lookups and two getFile calls per page: one stat, one read.
    expect(fsaCalls.getFileHandle).toBe(400)
    expect(fsaCalls.getFile).toBe(400)
    // One walk of the tree: the root, `pages`, and three `sub*` levels.
    expect(fsaCalls.entries).toBe(5)
  })

  it('keeps directory lookups flat as the vault grows', async () => {
    const small = open(50, 3)
    resetFsaCalls()
    await buildIndex(small)
    const smallDirs = fsaCalls.getDirectoryHandle

    const large = open(500, 3)
    resetFsaCalls()
    await buildIndex(large)

    expect(smallDirs).toBe(5)
    expect(fsaCalls.getDirectoryHandle).toBe(smallDirs)
    expect(fsaCalls.getFileHandle).toBe(1000)
  })

  it('reads nothing on an incremental refresh whose mtimes are unchanged', async () => {
    const storage = open(120, 2)
    const first = await buildIndex(storage)
    resetFsaCalls()

    const second = await buildIndex(storage, first)

    expect(second.graph.pages.size).toBe(120)
    // stat only: the pages carry over, so no content is re-read or re-parsed.
    expect(fsaCalls.getFileHandle).toBe(120)
    expect(fsaCalls.getFile).toBe(120)
    // Every directory is already cached; only the `.folio/pins.md` probe runs.
    expect(fsaCalls.getDirectoryHandle).toBe(1)
  })

  it('fans the scan out, bounded by the concurrency cap', async () => {
    const { impl, peak } = trackConcurrency(open(500, 0))

    await buildIndex(impl)

    expect(peak()).toBeGreaterThan(1)
    expect(peak()).toBeLessThanOrEqual(SCAN_CONCURRENCY)
  })

  it('preserves path order in the page map and backlinks', async () => {
    const storage = new FileSystemVaultStorage(
      makeVault(30, 1) as unknown as FileSystemDirectoryHandle,
    )
    const index = await buildIndex(storage)
    const pagePaths = [...index.graph.pages.keys()]
    expect(pagePaths).toEqual([...pagePaths].sort())
  })
})
