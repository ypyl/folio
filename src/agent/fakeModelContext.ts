// Test-support fake of the model-context interface (add-webmcp-tools), same role
// as vault/fakeHandle and editor/fakeEditor: implements the slice the app uses,
// and records enough for a test to assert what was registered, what a call
// resolved to, and whether an abort retired the surface.

import type { AgentTool, ModelContextLike } from './modelContext'

export class FakeModelContext implements ModelContextLike {
  /** Every tool registered so far, in registration order. A retired tool is
   *  gone from this list, as it would be for an agent listing tools. */
  readonly tools: AgentTool[] = []
  /** Every registration that arrived already aborted (a no-op the app still
   *  performs), so a test can tell those apart from a live one. */
  readonly abortedRegistrations: string[] = []

  registerTool(tool: AgentTool, options?: { signal?: AbortSignal }): void {
    const signal = options?.signal
    if (signal?.aborted) {
      this.abortedRegistrations.push(tool.name)
      return
    }
    this.tools.push(tool)
    signal?.addEventListener(
      'abort',
      () => {
        const at = this.tools.indexOf(tool)
        if (at >= 0) this.tools.splice(at, 1)
      },
      { once: true },
    )
  }

  /** The registered tool of that name, or undefined. */
  find(name: string): AgentTool | undefined {
    return this.tools.find((tool) => tool.name === name)
  }

  /** Call a registered tool the way an agent would. */
  async call(name: string, input: unknown): Promise<unknown> {
    const tool = this.find(name)
    if (!tool) throw new Error(`no tool named ${name}`)
    return tool.execute(input)
  }

  /** What an agent listing the surface would see: names only. */
  names(): string[] {
    return this.tools.map((tool) => tool.name)
  }
}
