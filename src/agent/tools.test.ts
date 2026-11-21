import { describe, expect, it } from 'vitest'
import { agentTools } from './tools'
import { MAX_READ_CHARS, MAX_SEARCH_ROWS, type AgentDeps } from './actions'

// The declarations' budgets (add-webmcp-tools, design D1): an agent's context is
// the reason the surface exists, so a name, a description, or a parameter
// description past its limit fails here rather than in a model's prompt.
const NAMES = [
  'search_notes',
  'read_note',
  'note_links',
  'app_state',
  'open_note',
  'create_note',
  'edit_note',
  'append_note',
  'add_reminder',
] as const

const READ_ONLY = ['search_notes', 'read_note', 'note_links', 'app_state', 'open_note']

type Schema = {
  type?: string
  properties?: Record<string, { description?: string }>
  required?: string[]
}

const schemaOf = (input: unknown) => input as Schema

describe('the tool surface (agent-tools)', () => {
  const tools = agentTools(() => null)

  it('declares exactly the fixed set of tools', () => {
    expect(tools.map((tool) => tool.name)).toEqual([...NAMES])
  })

  it('keeps every name and description inside its budget', () => {
    for (const tool of tools) {
      expect(tool.name.length).toBeLessThanOrEqual(30)
      expect(tool.description.length).toBeLessThanOrEqual(500)
      expect(tool.inputSchema).toBeTruthy()
      const schema = schemaOf(tool.inputSchema)
      expect(schema.type).toBe('object')
      for (const property of Object.values(schema.properties ?? {})) {
        expect((property.description ?? '').length).toBeLessThanOrEqual(150)
      }
      for (const name of schema.required ?? []) {
        expect(schema.properties?.[name]).toBeTruthy()
      }
    }
  })

  it('marks reads as changing nothing and writes as consequential', () => {
    for (const tool of tools) {
      const readOnly = READ_ONLY.includes(tool.name)
      expect(tool.annotations?.readOnlyHint === true).toBe(readOnly)
      expect(tool.annotations?.consequentialHint === true).toBe(!readOnly)
    }
  })

  it('marks the one result that carries page text as untrusted', () => {
    const untrusted = tools.filter((tool) => tool.annotations?.untrustedContentHint === true)
    expect(untrusted.map((tool) => tool.name)).toEqual(['read_note'])
  })

  it('names no tool that reads the vault as a set', () => {
    // No enumeration: an agent finds notes through search, so one call cannot
    // carry the whole folder (design D4).
    for (const tool of tools) {
      expect(tool.name).not.toMatch(/list|all_|dump/)
    }
  })

  it('fails every action with no vault rather than throwing', async () => {
    for (const tool of tools) {
      const result = (await tool.execute({ name: 'Ideas', query: 'ideas' })) as {
        ok: boolean
        error?: string
      }
      expect(result.ok).toBe(false)
      expect(result.error).toBe('no-vault')
    }
  })
})

describe('the tool surface reads the live app at call time (agent-tools)', () => {
  it('binds the deps at call time, not at registration', async () => {
    let folder = 'first'
    const deps = {
      folder,
      graph: null,
      drafts: { get: () => undefined },
      openPath: null,
      storage: null,
      today: '2026-09-15',
      remindersDue: 0,
      reminders: [],
      savePage: async () => true,
      saveReminders: async () => true,
      search: () => [],
      backlinks: () => [],
      forwardlinks: () => [],
      replaceOpen: () => false,
      appendOpen: () => {},
      open: () => {},
      record: () => {},
    } as unknown as AgentDeps
    const tools = agentTools(() => ({ ...deps, folder }))
    expect(
      (tools.find((one) => one.name === 'app_state')!.execute({}) as { folder: string }).folder,
    ).toBe('first')
    folder = 'second'
    expect(
      (tools.find((one) => one.name === 'app_state')!.execute({}) as { folder: string }).folder,
    ).toBe('second')
  })

  it('caps the read and search tools it advertises', () => {
    const read = tools_schema('read_note')
    expect(read.properties?.lines?.description).toContain('400')
    expect(tools_names().length).toBe(9)
    expect(MAX_SEARCH_ROWS).toBe(10)
    expect(MAX_READ_CHARS).toBeGreaterThan(0)
  })
})

function tools_names() {
  return agentTools(() => null).map((tool) => tool.name)
}

function tools_schema(name: string) {
  return schemaOf(agentTools(() => null).find((tool) => tool.name === name)!.inputSchema)
}
