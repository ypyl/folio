import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true, // RTL auto-cleanup needs a global afterEach
    environment: 'jsdom',
    // Two suites, split by reach: a unit test exercises one production module
    // in isolation (collaborators mocked or replaced by test doubles); an
    // integration test wires two or more of them together (a component subtree,
    // a storage adapter with the index, or the whole app). E2E lands later
    // against the specs. Files carry the `*.integration.test.*` marker so the
    // split is visible in the tree and in the runner's globs.
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.integration.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['src/**/*.integration.test.{ts,tsx}'],
        },
      },
    ],
    coverage: {
      // istanbul over v8: v8's is Istanbul-equivalent, but in this setup
      // (Vitest 5 + Vite 8) its remap produced one statement per file for
      // executed JSX modules, hiding real line granularity. istanbul is the
      // deterministic classic provider.
      provider: 'istanbul',
      include: ['src/**/*.{ts,tsx}'],
      // Test doubles live under src/ but are not shipped code, so they do not
      // belong in the denominator.
      exclude: ['src/main.tsx', 'src/**/fake*.ts'],
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