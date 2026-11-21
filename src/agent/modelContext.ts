// The browser's model-context interface (add-webmcp-tools, ADR-0036): the page
// side of WebMCP. A tool is a declaration the app registers; the agent calls it
// and the app runs one of its own actions. Nothing here decides what a tool
// does, and nothing here is a boundary: an extension the user installed can run
// JavaScript in this page anyway, so the surface exists to make an agent's
// intent legible and recordable, not to sandbox it.
//
// Registration is the whole gate. With the gate off the app registers nothing,
// so an agent that lists tools sees an empty set; aborting the controller
// retires every tool before the next frame.

/** One tool, as the interface takes it: a name, a description, a JSON Schema
 *  for its input, optional hints for the agent, and the function that runs it. */
export type AgentTool = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: {
    readOnlyHint?: boolean
    consequentialHint?: boolean
    untrustedContentHint?: boolean
  }
  execute: (input: unknown) => unknown
}

/** The subset of `document.modelContext` this app uses. Declared here because
 *  the interface is not in TypeScript's DOM library: it is an origin trial. */
export type ModelContextLike = {
  registerTool: (
    tool: AgentTool,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ) => unknown
}

/** The page's model-context interface, or null where the browser has none. Read
 *  defensively: a browser without WebMCP must be a no-op, not an error. Both
 *  places the interface has lived are read, because a preview build exposes it
 *  on `navigator` and the origin trial on `document` (Chrome 149): one code path
 *  then serves both, and a browser with neither registers nothing. */
export function modelContext(): ModelContextLike | null {
  const fromDocument = (document as Document & { modelContext?: ModelContextLike }).modelContext
  if (typeof fromDocument?.registerTool === 'function') return fromDocument
  const fromNavigator = (navigator as Navigator & { modelContext?: ModelContextLike }).modelContext
  return typeof fromNavigator?.registerTool === 'function' ? fromNavigator : null
}

/**
 * Register every tool under one controller, and return the function that retires
 * them. A browser without the interface registers nothing and still returns a
 * controller teardown, so the caller's lifecycle is the same either way.
 */
export function registerAgentTools(
  tools: readonly AgentTool[],
  controller: AbortController,
): { retire: () => void } {
  const context = modelContext()
  if (context) {
    for (const tool of tools) {
      try {
        void context.registerTool(tool, { signal: controller.signal })
      } catch {
        // A browser that rejects one registration must not take the app down
        // with it: the surface is an enhancement, and the record's surfaces do
        // not depend on it.
      }
    }
  }
  return { retire: () => controller.abort() }
}
