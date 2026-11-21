import { afterEach, describe, expect, it } from 'vitest'
import { registerAgentTools } from './modelContext'
import { agentTools } from './tools'
import { FakeModelContext } from './fakeModelContext'

// The registration is the whole gate (add-webmcp-tools, design D6): nothing with
// the gate off, everything with it on, and an abort that retires the surface
// before the next frame. A browser without the interface is a no-op.
function install(context: unknown): void {
  Object.defineProperty(document, 'modelContext', {
    configurable: true,
    writable: true,
    value: context,
  })
}

afterEach(() => {
  Reflect.deleteProperty(document, 'modelContext')
})

describe('registering the agent tools (add-webmcp-tools)', () => {
  it('registers every tool under one controller', () => {
    const context = new FakeModelContext()
    install(context)
    const controller = new AbortController()
    registerAgentTools(
      agentTools(() => null),
      controller,
    )
    expect(context.names()).toHaveLength(9)
    expect(context.names()).toContain('edit_note')
  })

  it('retires every tool when the controller aborts', () => {
    const context = new FakeModelContext()
    install(context)
    const controller = new AbortController()
    const { retire } = registerAgentTools(
      agentTools(() => null),
      controller,
    )
    retire()
    // An agent listing tools sees an empty set, not disabled ones.
    expect(context.names()).toEqual([])
  })

  it('registers nothing in a browser without the interface', () => {
    const controller = new AbortController()
    expect(() =>
      registerAgentTools(
        agentTools(() => null),
        controller,
      ),
    ).not.toThrow()
    expect(() =>
      registerAgentTools(
        agentTools(() => null),
        controller,
      ).retire(),
    ).not.toThrow()
  })

  it('survives one registration the browser rejects', () => {
    const registered: string[] = []
    install({
      registerTool: (tool: { name: string }) => {
        registered.push(tool.name)
        if (tool.name === 'edit_note') throw new Error('rejected')
      },
    })
    expect(() =>
      registerAgentTools(
        agentTools(() => null),
        new AbortController(),
      ),
    ).not.toThrow()
    // The rest of the surface still went in.
    expect(registered).toHaveLength(9)
  })

  it('reads the interface from navigator where a preview build keeps it there', () => {
    const context = new FakeModelContext()
    Object.defineProperty(navigator, 'modelContext', {
      configurable: true,
      writable: true,
      value: context,
    })
    try {
      registerAgentTools(
        agentTools(() => null),
        new AbortController(),
      )
      expect(context.names()).toHaveLength(9)
    } finally {
      Reflect.deleteProperty(navigator, 'modelContext')
    }
  })

  it('calls a registered tool through the fake the way an agent would', async () => {
    const context = new FakeModelContext()
    install(context)
    registerAgentTools(
      agentTools(() => null),
      new AbortController(),
    )
    // With no vault bound, the call answers a typed refusal rather than throwing.
    const result = (await context.call('app_state', {})) as { ok: boolean; error: string }
    expect(result.ok).toBe(false)
    expect(result.error).toBe('no-vault')
  })
})
