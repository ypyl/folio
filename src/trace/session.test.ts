import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createSessionTrace,
  describeError,
  LOG_DIR,
  RETENTION_MS,
  logFileName,
  logFileTime,
} from './session'
import type { VaultStorage } from '../vault/storage'

const START = Date.UTC(2026, 10, 5, 20, 3, 12, 345)
const DAY = 24 * 60 * 60 * 1000

/** The collaborator, replaced by a test double: a folder in a map. */
function fakeStorage() {
  const files = new Map<string, string | Blob>()
  const state = {
    files,
    writes: [] as { path: string; size: number }[],
    removed: [] as string[],
    failWrites: (_path: string) => false as boolean,
    failReads: false,
    failList: false,
  }
  const missing = (path: string) => new DOMException(`File not found: ${path}`, 'NotFoundError')
  const storage: VaultStorage = {
    async read(path) {
      if (state.failReads) throw new DOMException('Blocked', 'NotAllowedError')
      const value = files.get(path)
      if (value === undefined) throw missing(path)
      return typeof value === 'string' ? value : await value.text()
    },
    async write(path, content) {
      if (state.failWrites(path)) throw new DOMException('Blocked', 'NotAllowedError')
      files.set(path, content)
      state.writes.push({ path, size: content.length })
    },
    async writeBinary(path, blob) {
      if (state.failWrites(path)) throw new DOMException('Blocked', 'NotAllowedError')
      files.set(path, blob)
      state.writes.push({ path, size: blob.size })
    },
    async readBinary(path) {
      const value = files.get(path)
      if (value === undefined) throw missing(path)
      return typeof value === 'string' ? new Blob([value]) : value
    },
    async list(path) {
      if (state.failList) throw new DOMException('Blocked', 'NotAllowedError')
      const prefix = path === '' ? '' : `${path}/`
      return [...files.keys()].filter((key) => key.startsWith(prefix)).sort()
    },
    async stat(path) {
      if (state.failReads) throw new DOMException('Blocked', 'NotAllowedError')
      if (!files.has(path)) throw missing(path)
      return START
    },
    async remove(path) {
      if (!files.has(path)) throw missing(path)
      files.delete(path)
      state.removed.push(path)
    },
  }
  return { storage, state }
}

/** The one log file the fake folder holds, or `''`. */
function logPath(files: Map<string, string | Blob>): string {
  return [...files.keys()].find((path) => path.startsWith(`${LOG_DIR}/`)) ?? ''
}

function logText(files: Map<string, string | Blob>): string {
  const value = files.get(logPath(files))
  return typeof value === 'string' ? value : ''
}

/** This session's own file: the one the trace under test writes. */
const SESSION_LOG = `${LOG_DIR}/${logFileName(START, '4f2a')}`

function sessionText(files: Map<string, string | Blob>): string {
  const value = files.get(SESSION_LOG)
  return typeof value === 'string' ? value : ''
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(START)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('trace file names', () => {
  it('names a file for its UTC start and dates it back', () => {
    const name = logFileName(START, '4f2a')
    expect(name).toBe('2026-11-05T20-03-12Z-4f2a.log')
    expect(logFileTime(name)).toBe(Date.UTC(2026, 10, 5, 20, 3, 12))
  })

  it('dates only names this module writes', () => {
    expect(logFileTime('notes.txt')).toBeNull()
    expect(logFileTime('2026-11-05T20-03-12Z-4f2a.log.bak')).toBeNull()
    expect(logFileTime('2026-11-05-notes.log')).toBeNull()
  })
})

describe('describeError', () => {
  it('keeps the name and message, bounded', () => {
    expect(describeError(new DOMException('nope', 'NotAllowedError'))).toBe('NotAllowedError: nope')
    expect(describeError('plain')).toBe('plain')
    expect(describeError(new Error('x'.repeat(1000))).length).toBe(303)
  })
})

describe('the session trace', () => {
  it('opens one file at start with the session facts', async () => {
    const { storage, state } = fakeStorage()
    const trace = createSessionTrace(storage, { now: () => START, suffix: () => '4f2a' })
    trace.start({ version: '0.85.0', folder: 'notes' })
    await trace.flush()

    const path = logPath(state.files)
    expect(path).toBe(`${LOG_DIR}/2026-11-05T20-03-12Z-4f2a.log`)
    expect(logText(state.files)).toContain('session-start {"version":"0.85.0","folder":"notes"}')
  })

  it('drops events recorded before the session starts', async () => {
    const { storage, state } = fakeStorage()
    const trace = createSessionTrace(storage, { now: () => START, suffix: () => '4f2a' })
    trace.event('info', 'too-early')
    trace.start({ version: '0.85.0' })
    await trace.flush()
    expect(logText(state.files)).not.toContain('too-early')
  })

  it('writes many events as one write on the debounce', async () => {
    const { storage, state } = fakeStorage()
    const trace = createSessionTrace(storage, { now: () => START, suffix: () => '4f2a' })
    trace.start({ version: '0.85.0' })
    await trace.flush()
    state.writes.length = 0

    trace.event('info', 'page-open', { path: 'pages/A.md' })
    trace.event('info', 'edit', { path: 'pages/A.md', bytes: 12 })
    trace.event('info', 'write', { path: 'pages/A.md', bytes: 12 })
    expect(state.writes.length).toBe(0)

    await vi.advanceTimersByTimeAsync(1000)
    expect(state.writes.length).toBe(1)
    const text = logText(state.files)
    expect(text).toContain('page-open')
    expect(text).toContain('edit')
    expect(text).toContain('write')
  })

  it('caps the file and marks the cut', async () => {
    const { storage, state } = fakeStorage()
    const trace = createSessionTrace(storage, { now: () => START, suffix: () => '4f2a' })
    trace.start({ version: '0.85.0' })
    for (let index = 0; index < 2100; index++) trace.event('info', 'noise', { index })
    await trace.flush()

    const lines = logText(state.files).trimEnd().split('\n')
    expect(lines.length).toBeLessThanOrEqual(2000)
    expect(lines[0]).toContain('log-truncated')
    expect(lines[lines.length - 1]).toContain('"index":2099')
  })

  it('survives a folder that cannot hold its own log', async () => {
    const { storage, state } = fakeStorage()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const trace = createSessionTrace(storage, { now: () => START, suffix: () => '4f2a' })
    trace.start({ version: '0.85.0' })
    state.failWrites = () => true
    trace.event('info', 'write', { path: 'pages/A.md' })
    await expect(trace.flush()).resolves.toBeUndefined()
    await expect(trace.flush()).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledTimes(1)

    state.failWrites = () => false
    trace.event('info', 'page-open', { path: 'pages/A.md' })
    await trace.flush()
    expect(logText(state.files)).toContain('page-open')
  })

  it('records the end once, with its reason', async () => {
    const { storage, state } = fakeStorage()
    const trace = createSessionTrace(storage, { now: () => START, suffix: () => '4f2a' })
    trace.start({ version: '0.85.0' })
    await trace.end('folder-switch')
    await trace.end('again')
    expect(logText(state.files).match(/session-end/g)?.length).toBe(1)
    expect(logText(state.files)).toContain('"reason":"folder-switch"')
  })

  it('ends a session that never started without writing', async () => {
    const { storage, state } = fakeStorage()
    const trace = createSessionTrace(storage)
    await trace.end('never')
    expect(state.files.size).toBe(0)
    expect(state.writes.length).toBe(0)
  })
})

describe('the pruner', () => {
  it('removes its own files past seven days and leaves the rest', async () => {
    const { storage, state } = fakeStorage()
    const old = `${LOG_DIR}/${logFileName(START - 8 * DAY, 'aaaa')}`
    const recent = `${LOG_DIR}/${logFileName(START - 6 * DAY, 'bbbb')}`
    const foreign = `${LOG_DIR}/notes.txt`
    state.files.set(old, 'old')
    state.files.set(recent, 'recent')
    state.files.set(foreign, 'mine')

    const trace = createSessionTrace(storage, { now: () => START, suffix: () => '4f2a' })
    trace.start({ version: '0.85.0' })
    await vi.runAllTimersAsync()

    expect(state.removed).toEqual([old])
    expect(state.files.has(recent)).toBe(true)
    expect(state.files.has(foreign)).toBe(true)
    expect(sessionText(state.files)).toContain('prune {"removed":1,"kept":2}')
  })

  it('does nothing when the folder has no log directory', async () => {
    const { storage, state } = fakeStorage()
    const trace = createSessionTrace(storage, { now: () => START, suffix: () => '4f2a' })
    trace.start({ version: '0.85.0' })
    await vi.runAllTimersAsync()
    expect(state.removed).toEqual([])
    expect(logText(state.files)).toContain('session-start')
  })

  it('keeps a file it cannot remove', async () => {
    const { storage, state } = fakeStorage()
    const old = `${LOG_DIR}/${logFileName(START - 8 * DAY, 'aaaa')}`
    state.files.set(old, 'old')
    const remove = vi.spyOn(storage, 'remove').mockRejectedValue(new Error('locked'))
    const trace = createSessionTrace(storage, { now: () => START, suffix: () => '4f2a' })
    trace.start({ version: '0.85.0' })
    await vi.runAllTimersAsync()
    expect(remove).toHaveBeenCalledWith(old)
    expect(sessionText(state.files)).toContain('prune {"removed":0,"kept":2}')
  })

  it('keeps the retention window', () => {
    expect(RETENTION_MS).toBe(7 * 24 * 60 * 60 * 1000)
  })
})

describe('the storage decorator', () => {
  async function traced() {
    const fake = fakeStorage()
    const trace = createSessionTrace(fake.storage, { now: () => START, suffix: () => '4f2a' })
    trace.start({ version: '0.85.0' })
    await trace.flush()
    /** The trace as it stands on disk: buffered lines are written by a flush. */
    const log = async () => {
      await trace.flush()
      return logText(fake.state.files)
    }
    return { ...fake, trace, store: trace.storage, log }
  }

  it('records a write with its size and a write failure with its error', async () => {
    const { state, store, log } = await traced()
    await store.write('pages/A.md', 'hello')
    expect(await log()).toContain('write {"path":"pages/A.md","bytes":5')

    state.failWrites = (path) => !path.startsWith(LOG_DIR)
    await expect(store.write('pages/A.md', 'hello')).rejects.toThrow()
    const text = await log()
    expect(text).toContain('write-failed {"path":"pages/A.md","bytes":5')
    expect(text).toContain('NotAllowedError: Blocked')
  })

  it('records a binary write', async () => {
    const { store, log } = await traced()
    await store.writeBinary('assets/a.png', new Blob([new Uint8Array(3)]))
    expect(await log()).toContain('write {"path":"assets/a.png","bytes":3')
  })

  it('records a failed read, readBinary, and stat, and rethrows', async () => {
    const { state, store, log } = await traced()
    await expect(store.read('pages/Missing.md')).rejects.toThrow()
    await expect(store.readBinary('pages/Missing.md')).rejects.toThrow()
    await expect(store.stat('pages/Missing.md')).rejects.toThrow()
    const text = await log()
    expect(text).toContain('read-failed {"path":"pages/Missing.md"')
    expect(text.match(/stat-failed/g)?.length).toBe(1)

    state.failReads = true
    await expect(store.read('pages/A.md')).rejects.toThrow()
    expect(await log()).toContain(
      'read-failed {"path":"pages/A.md","error":"NotAllowedError: Blocked"}',
    )
  })

  it('records a listing and a listing failure', async () => {
    const { state, store, log } = await traced()
    state.files.set('pages/A.md', 'a')
    await store.list('')
    expect(await log()).toContain('list {"path":"/","count":2')
    await store.list('pages')
    expect(await log()).toContain('list {"path":"pages","count":1')

    state.failList = true
    await expect(store.list('')).rejects.toThrow()
    expect(await log()).toContain('list-failed {"path":"","error"')
  })

  it('records a removal and a removal failure', async () => {
    const { state, store, log } = await traced()
    state.files.set('pages/Old.md', 'x')
    await store.remove('pages/Old.md')
    expect(await log()).toContain('remove {"path":"pages/Old.md"}')
    await expect(store.remove('pages/Old.md')).rejects.toThrow()
    expect(await log()).toContain('remove-failed {"path":"pages/Old.md"')
  })

  it('reads and stats without a line when nothing failed', async () => {
    const { state, store, log } = await traced()
    state.files.set('pages/A.md', 'a')
    await expect(store.read('pages/A.md')).resolves.toBe('a')
    await expect(store.stat('pages/A.md')).resolves.toBe(START)
    await expect(store.readBinary('pages/A.md')).resolves.toBeInstanceOf(Blob)
    const text = await log()
    expect(text).not.toContain('read-failed')
    expect(text).not.toContain('stat-failed')
  })
})
