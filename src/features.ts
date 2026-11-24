// Build-time feature flags. A capability that ships behind a flag keeps its
// seams, so flipping the flag is the whole enable step (the `PRESENT_ENABLED`
// precedent). Flags are constants, not preferences: the app keeps no settings
// store and the vault holds no flag. They are read at call time, so a test can
// flip one without remounting the world.
//
// A flagged capability is enabled by its flag OR by the app's experimental
// switch (prerelease): the flag is the shipped default and the test override,
// the switch lets a user try it without a rebuild (add-agent-activity-log, the
// shape gate-reminders-behind-a-flag and add-prerelease-mode settled).

export const features = {
  /**
   * The agent's tool surface (add-webmcp-tools) and the record of what it did
   * (add-agent-activity-log): pages a browser agent reads and writes on the
   * user's behalf, the session's account of those actions, and the status bar's
   * disclosure onto it. Off in the shipped build. A run can turn it on with
   * `VITE_AGENT_TOOLS=1` (the e2e does), and the app's experimental switch turns
   * it on without a rebuild, so the engine stays exercised while the shipped
   * build registers no tool and shows no surface.
   */
  agentTools: import.meta.env.VITE_AGENT_TOOLS === '1',

  /**
   * A fenced `mermaid` block drawn on the page and on a slide
   * (add-mermaid-diagrams). Off in the shipped build: a vault that never writes
   * a diagram sees no difference, and the engine is fetched only when a diagram
   * is actually drawn, so even an on build pays nothing until then. A run can
   * turn it on with `VITE_DIAGRAMS=1`, and the app's experimental switch turns
   * it on without a rebuild. While off, the pane supplies the editor no drawing
   * runtime, so a fence reads as source and nothing is fetched.
   */
  diagrams: import.meta.env.VITE_DIAGRAMS === '1',
}

/** What a gated capability turns on, as the rail's experimental popup states it
 *  (explain-the-experimental-switch): one entry per flag in `features`, so the
 *  popup can neither describe a capability that no flag gates nor omit one that
 *  a flag gates. `features.test.ts` holds the two sets equal. */
export type ExperimentalFeature = {
  /** The build-time flag that gates it. */
  flag: keyof typeof features
  /** The capability's name, as the popup lists it. */
  label: string
  /** One line under the name: what turning the switch on enables. */
  detail: string
}

export const experimentalFeatures: readonly ExperimentalFeature[] = [
  {
    flag: 'agentTools',
    label: 'Agent tools',
    detail: 'Lets a browser AI agent read and edit pages, and records what it did',
  },
  {
    flag: 'diagrams',
    label: 'Diagrams',
    detail:
      'Draws a page\u2019s mermaid code blocks as diagrams, in the page and in a presentation',
  },
]
