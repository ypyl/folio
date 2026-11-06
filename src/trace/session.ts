// The session trace (add-session-trace-logs, ADR-0035): one plain-text file per
// vault session, kept in `.folio/logs/` under the folder it describes, pruned to
// the last seven days. It records what the app did to the folder - writes and
// failures through a storage decorator, lifecycle and scan facts from the layers
// that know them - and never page text. Recording is best-effort: it buffers,
// writes on a short delay, and a failed write changes nothing the user did.
//
// Keystroke budget: an event is a push into an array plus a timer arm, and the
// only caller on the typing path records once per dirty burst. The log file is
// rewritten whole on a flush because VaultStorage has no append (ADR-0013); a
// flush costs one bounded write and never runs on a keystroke.

import type { VaultStorage } from '../vault/storage'

/** The directory a folder's session logs live in (ADR-0015's app-owned state). */
export const LOG_DIR = '.folio/logs'

/** How long a session log is kept, before the next session prunes it. */
export const RETENTION_MS = 7 * 24 * 60 * 60 * 1000

/** The debounce between the first buffered line and its write. Short, because
 *  the point of the file is to survive the tab going away. */
const FLUSH_DELAY_MS = 1000

/** The line cap: past it the oldest quarter is dropped and marked, so a long
 *  session's file stays bounded and one flush stays one small write. */
const MAX_LINES = 2000

export type TraceLevel = 'info' | 'warn' | 'error'

/** A line's payload. `undefined` values are left out, so an optional field can
 *  be passed without a conditional. */
export type TraceFields = Record<string, string | number | boolean | null | undefined>

/** What a caller records events into. `App` and `useIndex` hold this, never the
 *  whole sink, so nothing else can flush or end a session. */
export interface TraceSink {
  event(level: TraceLevel, name: string, fields?: TraceFields): void
}

export interface SessionTrace extends TraceSink {
  /** The folder's storage with the trace decorator applied: every write and
   *  every failure is recorded through it. */
  readonly storage: VaultStorage
  /** Open the session's file. Idempotent, so a double mount writes one file. */
  start(fields: TraceFields): void
  /** Write the buffered lines now. */
  flush(): Promise<void>
  /** Record the reason the session ended and flush. Idempotent. */
  end(reason: string): Promise<void>
}

/** A trace file's name: UTC, so names sort and retention is arithmetic, plus a
 *  random suffix so two tabs opening the same folder in one second differ. */
const NAME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})Z-([0-9a-f]{4})\.log$/

/** `2026-11-05T20:03:12.345Z` -> `2026-11-05T20-03-12Z-4f2a.log`. */
export function logFileName(startMs: number, suffix: string): string {
  const iso = new Date(startMs).toISOString()
  return `${iso.slice(0, 10)}T${iso.slice(11, 13)}-${iso.slice(14, 16)}-${iso.slice(17, 19)}Z-${suffix}.log`
}

/** The start time a trace file's name states, or null for a name this module
 *  did not write. The pruner removes only names it can date. */
export function logFileTime(name: string): number | null {
  const match = NAME_PATTERN.exec(name)
  if (!match) return null
  return Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
  )
}

/** One error, as a single bounded field: a stack would turn one line into many
 *  and the message is what identifies the failure. */
export function describeError(error: unknown): string {
  const text = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  return text.length > 300 ? `${text.slice(0, 300)}...` : text
}

type Options = {
  /** The clock, for tests. */
  now?: () => number
  /** The 4 hex characters after the timestamp, for tests. */
  suffix?: () => string
}

/**
 * A session over one folder's storage. `start` names and opens the file (and
 * prunes old ones); events before it are dropped, because a session has no file
 * to put them in until then.
 */
export function createSessionTrace(raw: VaultStorage, options: Options = {}): SessionTrace {
  const now = options.now ?? Date.now
  const suffix = options.suffix ?? randomSuffix
  const lines: string[] = []
  let path = ''
  let started = false
  let ended = false
  let timer: ReturnType<typeof setTimeout> | null = null
  /** Bumped by every buffered line; `written` is the revision on disk. */
  let revision = 0
  let written = -1
  /** Flushes run one after another, so two writes never race the same file. */
  let queue: Promise<void> = Promise.resolve()
  let warned = false

  function event(level: TraceLevel, name: string, fields?: TraceFields): void {
    if (!started) return
    lines.push(formatLine(now(), level, name, fields))
    if (lines.length > MAX_LINES) {
      const dropped = Math.ceil(MAX_LINES / 4)
      lines.splice(0, dropped)
      lines.unshift(formatLine(now(), 'warn', 'log-truncated', { dropped }))
    }
    revision++
    if (timer === null) {
      timer = setTimeout(() => {
        timer = null
        void flush()
      }, FLUSH_DELAY_MS)
    }
  }

  function flush(): Promise<void> {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    if (!started || revision === written) return queue
    const at = revision
    const text = lines.join('\n') + '\n'
    queue = queue.then(async () => {
      try {
        await raw.write(path, text)
        written = Math.max(written, at)
      } catch (error) {
        // A folder that cannot hold its own log is exactly the folder this file
        // is meant to explain, so this must never become a user-visible error,
        // and it must never loop: report once and try again on the next flush.
        if (!warned) {
          warned = true
          console.warn('[folio trace] could not write the session log:', describeError(error))
        }
      }
    })
    return queue
  }

  async function end(reason: string): Promise<void> {
    if (!started || ended) return
    ended = true
    event('info', 'session-end', { reason })
    await flush()
  }

  function start(fields: TraceFields): void {
    if (started) return
    started = true
    path = `${LOG_DIR}/${logFileName(now(), suffix())}`
    event('info', 'session-start', fields)
    // The file exists from the start, so a session that crashes before its
    // first save still leaves something to read. Pruning waits for that write:
    // its listing asks for the directory the write is about to create, and the
    // two would race for it.
    void flush().then(() => prune())
  }

  /** Remove this app's trace files older than the retention window. Runs off
   *  the raw storage, so it is not itself an event, and only names the module
   *  wrote are candidates: anything else in the directory is left alone. */
  async function prune(): Promise<void> {
    const cutoff = now() - RETENTION_MS
    let entries: string[]
    try {
      entries = await raw.list(LOG_DIR)
    } catch {
      return // no directory yet: nothing to prune
    }
    let removed = 0
    let kept = 0
    for (const entry of entries) {
      const at = logFileTime(entry.slice(entry.lastIndexOf('/') + 1))
      if (at === null) continue
      if (at >= cutoff) {
        kept++
        continue
      }
      try {
        await raw.remove(entry)
        removed++
      } catch {
        // A file that cannot be removed stays; retention is best-effort.
        kept++
      }
    }
    event('info', 'prune', { removed, kept })
  }

  return {
    storage: traceStorage(raw, event),
    start,
    flush,
    end,
    event,
  }
}

function randomSuffix(): string {
  return Math.floor(Math.random() * 0x10000)
    .toString(16)
    .padStart(4, '0')
}

function formatLine(at: number, level: TraceLevel, name: string, fields?: TraceFields): string {
  const head = `${new Date(at).toISOString()} ${level.padEnd(5)} ${name}`
  if (fields === undefined) return head
  const payload: TraceFields = {}
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) payload[key] = value
  }
  return `${head} ${JSON.stringify(payload)}`
}

/**
 * A VaultStorage whose writes and failures land in the trace. Writes are the
 * half that matters and every one of them comes through here by construction
 * (ADR-0003); reads and stats are recorded only when they fail, because a scan
 * would otherwise write one line per file.
 */
function traceStorage(raw: VaultStorage, event: TraceSink['event']): VaultStorage {
  return {
    async read(path) {
      try {
        return await raw.read(path)
      } catch (error) {
        event('error', 'read-failed', { path, error: describeError(error) })
        throw error
      }
    },

    async write(path, content) {
      const at = Date.now()
      try {
        await raw.write(path, content)
        event('info', 'write', { path, bytes: content.length, ms: Date.now() - at })
      } catch (error) {
        event('error', 'write-failed', {
          path,
          bytes: content.length,
          ms: Date.now() - at,
          error: describeError(error),
        })
        throw error
      }
    },

    async writeBinary(path, blob) {
      const at = Date.now()
      try {
        await raw.writeBinary(path, blob)
        event('info', 'write', { path, bytes: blob.size, ms: Date.now() - at })
      } catch (error) {
        event('error', 'write-failed', {
          path,
          bytes: blob.size,
          ms: Date.now() - at,
          error: describeError(error),
        })
        throw error
      }
    },

    async readBinary(path) {
      try {
        return await raw.readBinary(path)
      } catch (error) {
        event('error', 'read-failed', { path, error: describeError(error) })
        throw error
      }
    },

    async list(path) {
      const at = Date.now()
      try {
        const files = await raw.list(path)
        event('info', 'list', {
          path: path === '' ? '/' : path,
          count: files.length,
          ms: Date.now() - at,
        })
        return files
      } catch (error) {
        event('error', 'list-failed', { path, error: describeError(error) })
        throw error
      }
    },

    async stat(path) {
      try {
        return await raw.stat(path)
      } catch (error) {
        event('error', 'stat-failed', { path, error: describeError(error) })
        throw error
      }
    },

    async remove(path) {
      try {
        await raw.remove(path)
        event('info', 'remove', { path })
      } catch (error) {
        event('error', 'remove-failed', { path, error: describeError(error) })
        throw error
      }
    },
  }
}
