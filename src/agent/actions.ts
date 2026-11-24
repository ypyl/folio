// What a tool may do, as the app's own actions (add-webmcp-tools, ADR-0036). Each
// action resolves a page name by the app's naming rule, reads through the app's
// view of the page, and writes through the app's write-through path, so the
// Files listing, the backlinks, and the search corpus are true before the call
// returns. Nothing here is a filesystem API: no action takes a path where a name
// would do, and nothing removes, renames, or moves a file.
//
// The two write shapes (design D3): a change to the open page is one editor
// transaction matched against the live document, so it merges with the user's
// typing, undoes with Mod-z, and keeps the caret; a change to any other page is a
// file write through the write-through path. Matching against a different
// snapshot than the one mutated is the bug this rule exists to prevent: writing
// the file of an open page would be overwritten by the debounced saver.
//
// Keystroke budget: nothing here runs on the typing path. A call costs one page
// read at most, one string match, and one dispatch or one write.

import type { Graph, IndexPage } from '../vault/index'
import { isPagePath, resolveReferencePath } from '../vault/index'
import type { DraftStore } from '../editor/drafts'
import type { Recurrence, ReminderRule } from '../vault/reminders'
import { dayParts } from '../vault/dates'
import { withTrailingBlankLine } from '../vault/trailing'
import type { SearchResult } from '../search/core'
import type { LinkRow } from '../components/MetaPanel'

/** How many rows a search answers with. Small on purpose: an agent reads one
 *  page, and a result set is not a way to enumerate a vault. */
export const MAX_SEARCH_ROWS = 10
/** A read's line window, and the character cap that bounds every result. */
export const MAX_READ_LINES = 400
export const MAX_READ_CHARS = 4000

/** Why an action refused, as the agent reads it. Each is distinguishable, so a
 *  caller can act on the failure instead of retrying blindly (design D5). */
export type AgentError =
  | 'no-vault'
  | 'refused-path'
  | 'not-found'
  | 'ambiguous'
  | 'exists'
  | 'invalid'
  | 'save-failed'
  | 'read-failed'

export type AgentFailure = { ok: false; error: AgentError; message: string }

/** What a write reports: the path it touched and the lines it added and
 *  removed. Never the page's new text (design D4). */
export type AgentWrite = { ok: true; path: string; name: string; added: number; removed: number }

export type AgentRead = {
  ok: true
  path: string
  name: string
  text: string
  total_lines: number
  from_line: number
  truncated: boolean
}

export type AgentLinks = {
  ok: true
  path: string
  name: string
  backlinks: string[]
  forwardlinks: string[]
  unresolved: string[]
}

export type AgentState = {
  ok: true
  folder: string
  open_page: string | null
  today: string
  reminders_due: number
}

export type AgentSearch = {
  ok: true
  results: { name: string; path: string; kind: SearchResult['kind'] }[]
}

/** Everything the actions read, all of it the app's own state (design D1). */
export type AgentDeps = {
  /** The active vault's storage, or null while no folder is usable. */
  storage: { read(path: string): Promise<string> } | null
  graph: Graph | null
  drafts: DraftStore
  /** The open page's path, or null. */
  openPath: string | null
  /** The active folder's name, for `app_state`. */
  folder: string
  /** Today's journal day, `YYYY-MM-DD`. */
  today: string
  /** Reminders due on the open day, as the badge's own count states it. */
  remindersDue: number
  /** The index's reminder rules, in file order. */
  reminders: readonly ReminderRule[]
  /** One replacement in the open document, as one transaction. */
  replaceOpen: (find: string, replace: string) => boolean
  /** Append to the open document without moving the caret. */
  appendOpen: (markdown: string) => void
  /** Open a page by its resolved path, the app's own navigation. */
  open: (path: string) => void
  /** The app's write-through page save: write, then update the index. */
  savePage: (path: string, content: string) => Promise<boolean>
  /** The app's write-through reminder save: render the rules, then write. */
  saveReminders: (rules: ReminderRule[]) => Promise<boolean>
  /** The app's search over the live corpus. */
  search: (query: string) => SearchResult[]
  /** The page's backlink and forwardlink rows, as the right panel lists them. */
  backlinks: (page: IndexPage) => LinkRow[]
  forwardlinks: (page: IndexPage) => LinkRow[]
  /** Record what happened, for the session's account of it. */
  record: (tool: string, path: string, added: number, removed: number) => void
}

/** Lines a piece of text contributes, for the counts a write reports. A
 *  replacement's counts are its own line counts, not a diff: the record says
 *  what changed, not which line moved into which. */
function lines(text: string): number {
  return text === '' ? 0 : text.split('\n').length
}

const fail = (error: AgentError, message: string): AgentFailure => ({ ok: false, error, message })

/** No folder is usable: every tool answers the same refusal. */
const noVault = () => fail('no-vault', 'no folder is open')

const REFUSED_STATE = 'a path under .folio/ belongs to the app; use its own tools'

/** The page a name names, or a failure explaining why it names none. The app's
 *  rule decides (ADR-0019): a calendar date is a journal day, anything else is a
 *  page of that name, existing or not. */
function resolveName(
  deps: AgentDeps,
  name: string,
): { ok: true; path: string; title: string } | AgentFailure {
  const trimmed = name.trim()
  if (trimmed.toLowerCase().startsWith('.folio')) return fail('refused-path', REFUSED_STATE)
  if (trimmed === '' || trimmed.startsWith('.') || trimmed.includes('/')) {
    return fail('invalid', 'a page name is a name, not a path')
  }
  const path = resolveReferencePath(trimmed, deps.graph?.byName ?? new Map())
  if (!isPagePath(path)) return fail('refused-path', REFUSED_STATE)
  const indexed = deps.graph?.pages.get(path)
  return { ok: true, path, title: indexed ? indexed.title : trimmed }
}

/** The page's text as the app holds it right now: the open document's draft when
 *  the page is open (which is the document the user is typing in), otherwise the
 *  file. Null means the page holds no text at all — no file, and nothing typed
 *  into an open document — which is an empty page a create may write. */
async function currentText(deps: AgentDeps, path: string): Promise<string | null> {
  if (path === deps.openPath) {
    const draft = deps.drafts.get(path)
    if (draft) {
      // The index's file set is what says whether the folder holds a file for
      // this path: a draft exists for a page opened from a reference too, seeded
      // clean from nothing (agent-tools: create on the open page).
      const typed = draft.content !== '' || draft.saved !== ''
      return typed || deps.graph?.files.has(path) ? draft.content : null
    }
  }
  if (!deps.storage) return null
  try {
    return await deps.storage.read(path)
  } catch (error) {
    // The index is the app's own answer to "does this page have a file", so a
    // page it does not list is an empty page and anything else stays a failure:
    // an append must never write over a page it could not read.
    if (!deps.graph?.files.has(path)) return null
    throw error
  }
}

/** The text an append produces: the existing body, one blank line, the new
 *  body, and the app's terminal empty line. */
function joined(existing: string, body: string): string {
  return withTrailingBlankLine(`${existing.replace(/\n+$/, '')}\n\n${body}`)
}

export function agentActions(deps: AgentDeps) {
  return {
    /** Find notes by name or content, through the app's own ranking. */
    search(input: { query?: unknown }): AgentSearch | AgentFailure {
      const query = typeof input.query === 'string' ? input.query : ''
      if (query.trim() === '') return fail('invalid', 'a query is required')
      const results = deps.search(query).slice(0, MAX_SEARCH_ROWS)
      return {
        ok: true,
        results: results.map((one) => ({ name: one.title, path: one.path, kind: one.kind })),
      }
    },

    /** One page's text, as a line window inside a character cap. */
    async read(input: {
      name?: unknown
      from_line?: unknown
      lines?: unknown
    }): Promise<AgentRead | AgentFailure> {
      if (!deps.storage) return noVault()
      if (typeof input.name !== 'string') return fail('invalid', 'a page name is required')
      const resolved = resolveName(deps, input.name)
      if (!resolved.ok) return resolved
      let text: string | null
      try {
        text = await currentText(deps, resolved.path)
      } catch {
        return fail('read-failed', 'the page could not be read')
      }
      const whole = text ?? ''
      const all = whole.split('\n')
      const from = Math.max(1, Math.round(Number(input.from_line) || 1))
      const asked = Math.max(1, Math.round(Number(input.lines) || MAX_READ_LINES))
      const window = all.slice(from - 1, from - 1 + Math.min(asked, MAX_READ_LINES))
      const sliced = window.join('\n')
      const clipped = sliced.length > MAX_READ_CHARS ? sliced.slice(0, MAX_READ_CHARS) : sliced
      return {
        ok: true,
        path: resolved.path,
        name: resolved.title,
        text: clipped,
        total_lines: all.length,
        from_line: from,
        truncated: clipped.length < whole.length,
      }
    },

    /** What links to the page, what it links to, and what it names but does not
     *  have. */
    links(input: { name?: unknown }): AgentLinks | AgentFailure {
      if (!deps.storage) return noVault()
      if (typeof input.name !== 'string') return fail('invalid', 'a page name is required')
      const resolved = resolveName(deps, input.name)
      if (!resolved.ok) return resolved
      const page = deps.graph?.pages.get(resolved.path)
      if (!page) {
        return {
          ok: true,
          path: resolved.path,
          name: resolved.title,
          backlinks: [],
          forwardlinks: [],
          unresolved: [],
        }
      }
      const forward = deps.forwardlinks(page)
      return {
        ok: true,
        path: page.path,
        name: page.title,
        backlinks: deps.backlinks(page).map((row) => row.title),
        forwardlinks: forward.filter((row) => row.materialized).map((row) => row.title),
        unresolved: forward.filter((row) => !row.materialized).map((row) => row.title),
      }
    },

    /** Where the app is: the folder, the open page, today, and what is due. */
    state(): AgentState {
      return {
        ok: true,
        folder: deps.folder,
        open_page: deps.openPath,
        today: deps.today,
        reminders_due: deps.remindersDue,
      }
    },

    /** Open a page, the way choosing a row does. */
    open(input: { name?: unknown }): { ok: true; path: string; name: string } | AgentFailure {
      if (!deps.storage) return noVault()
      if (typeof input.name !== 'string') return fail('invalid', 'a page name is required')
      const resolved = resolveName(deps, input.name)
      if (!resolved.ok) return resolved
      deps.open(resolved.path)
      return { ok: true, path: resolved.path, name: resolved.title }
    },

    /** Create a page with the text given, through the write-through path. */
    async create(input: { name?: unknown; text?: unknown }): Promise<AgentWrite | AgentFailure> {
      if (!deps.storage) return noVault()
      if (typeof input.name !== 'string') return fail('invalid', 'a page name is required')
      const text = typeof input.text === 'string' ? input.text : ''
      const resolved = resolveName(deps, input.name)
      if (!resolved.ok) return resolved
      const existing = await currentText(deps, resolved.path)
      if (existing !== null) {
        return fail('exists', 'the page has text already; append to it or edit it instead')
      }
      const added = lines(withTrailingBlankLine(text))
      if (resolved.path === deps.openPath) {
        // The open page is the editor's document (design D3): the create is one
        // insert into it, and the pane's own save writes the file. Writing the
        // file here would be overwritten by that save.
        deps.appendOpen(text)
      } else {
        const next = withTrailingBlankLine(text)
        if (!(await deps.savePage(resolved.path, next))) {
          return fail('save-failed', 'the page could not be written')
        }
      }
      deps.record('create_note', resolved.path, added, 0)
      return { ok: true, path: resolved.path, name: resolved.title, added, removed: 0 }
    },

    /** Replace one exact string in a page: the open page as one transaction,
     *  any other page as a write. A match that is absent or not unique changes
     *  nothing. */
    async edit(input: {
      name?: unknown
      old_string?: unknown
      new_string?: unknown
    }): Promise<AgentWrite | AgentFailure> {
      if (!deps.storage) return noVault()
      if (typeof input.name !== 'string') return fail('invalid', 'a page name is required')
      const find = typeof input.old_string === 'string' ? input.old_string : ''
      const replace = typeof input.new_string === 'string' ? input.new_string : ''
      if (find === '') return fail('invalid', 'old_string is required')
      const resolved = resolveName(deps, input.name)
      if (!resolved.ok) return resolved
      let text: string | null
      try {
        text = await currentText(deps, resolved.path)
      } catch {
        return fail('read-failed', 'the page could not be read')
      }
      const whole = text ?? ''
      const at = whole.indexOf(find)
      if (at < 0) {
        return fail('not-found', 'the text is not in the page; read it again')
      }
      if (whole.indexOf(find, at + find.length) >= 0) {
        return fail('ambiguous', 'the text occurs more than once; include more of it')
      }
      const added = lines(replace)
      const removed = lines(find)
      if (resolved.path === deps.openPath) {
        // One transaction against the document the user is typing in. The match
        // was made against that same document, so a false result is a race the
        // caller retries from a fresh read.
        if (!deps.replaceOpen(find, replace)) {
          return fail('not-found', 'the page changed; read it again')
        }
      } else {
        const next = whole.slice(0, at) + replace + whole.slice(at + find.length)
        if (!(await deps.savePage(resolved.path, next))) {
          return fail('save-failed', 'the page could not be written')
        }
      }
      deps.record('edit_note', resolved.path, added, removed)
      return { ok: true, path: resolved.path, name: resolved.title, added, removed }
    },

    /** Add text at the end of a page, keeping the app's terminal empty line. */
    async append(input: { name?: unknown; text?: unknown }): Promise<AgentWrite | AgentFailure> {
      if (!deps.storage) return noVault()
      if (typeof input.name !== 'string') return fail('invalid', 'a page name is required')
      const body = typeof input.text === 'string' ? input.text : ''
      if (body.trim() === '') return fail('invalid', 'text is required')
      const resolved = resolveName(deps, input.name)
      if (!resolved.ok) return resolved
      let text: string | null
      try {
        text = await currentText(deps, resolved.path)
      } catch {
        return fail('read-failed', 'the page could not be read')
      }
      const added = lines(body)
      if (resolved.path === deps.openPath) {
        deps.appendOpen(body)
      } else {
        const next = joined(text ?? '', body)
        if (!(await deps.savePage(resolved.path, next))) {
          return fail('save-failed', 'the page could not be written')
        }
      }
      deps.record('append_note', resolved.path, added, 0)
      return { ok: true, path: resolved.path, name: resolved.title, added, removed: 0 }
    },

    /** Set the page's reminder rule, through the app's rule writer, so the file
     *  keeps its header, its canonical reference form, and its rule order. */
    async remind(input: {
      name?: unknown
      recurrence?: unknown
      anchor?: unknown
    }): Promise<AgentWrite | AgentFailure> {
      if (!deps.storage) return noVault()
      if (typeof input.name !== 'string') return fail('invalid', 'a page name is required')
      const recurrence = String(input.recurrence ?? '') as Recurrence
      if (!['once', 'daily', 'weekly', 'monthly', 'yearly'].includes(recurrence)) {
        return fail('invalid', 'recurrence is once, daily, weekly, monthly, or yearly')
      }
      const anchor = String(input.anchor ?? '')
      if (dayParts(anchor) === null) return fail('invalid', 'anchor is a calendar day, YYYY-MM-DD')
      const resolved = resolveName(deps, input.name)
      if (!resolved.ok) return resolved
      const rule: ReminderRule = { recurrence, anchor, target: resolved.title }
      const kept = deps.reminders.filter(
        (one) => one.target.toLowerCase() !== rule.target.toLowerCase(),
      )
      if (!(await deps.saveReminders([...kept, rule]))) {
        return fail('save-failed', 'the reminder file could not be written')
      }
      const path = '.folio/reminders.md'
      deps.record('add_reminder', path, 1, 0)
      return { ok: true, path, name: resolved.title, added: 1, removed: 0 }
    },
  }
}

export type AgentActionSet = ReturnType<typeof agentActions>
