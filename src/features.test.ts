import { afterEach, describe, expect, it, vi } from 'vitest'

// The flags are read at module load, so each case imports the module fresh with
// the environment it wants (add-session-trace-logs).
afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('build-time feature flags', () => {
  it('reads VITE_TRACE into features.trace', async () => {
    vi.stubEnv('VITE_TRACE', '1')
    vi.resetModules()
    const { features } = await import('./features')
    expect(features.trace).toBe(true)
  })

  it('leaves tracing off when the build sets no flag', async () => {
    vi.stubEnv('VITE_TRACE', '')
    vi.resetModules()
    const { features } = await import('./features')
    expect(features.trace).toBe(false)
  })

  // The rail's experimental popup reads this list (explain-the-experimental-
  // switch): a flag added without its description would hide from the popup, so
  // the two sets must be equal in both directions.
  it('describes every gated feature, and only gated ones', async () => {
    const { experimentalFeatures, features } = await import('./features')
    expect(experimentalFeatures.map((feature) => feature.flag).sort()).toEqual(
      Object.keys(features).sort(),
    )
  })
})
