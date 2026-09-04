import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true, // RTL auto-cleanup needs a global afterEach
    environment: 'jsdom',
    coverage: {
      // istanbul over v8: v8's is Istanbul-equivalent, but in this setup
      // (Vitest 5 + Vite 8) its remap produced one statement per file for
      // executed JSX modules, hiding real line granularity. istanbul is the
      // deterministic classic provider.
      provider: 'istanbul',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      // keep the report even when thresholds fail, so failures are diagnosable
      reportOnFailure: true,
    },
  },
})