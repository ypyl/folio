// The compact shell's breakpoint is declared twice, and neither declaration can
// read the other: `src/compact.ts` holds it because the shell's behavior depends
// on it (whether the collapse strips exist, whether a fold applies, which view
// leads at load), and `src/index.css` holds it because the compact composition
// is a layout the browser applies before any state settles. A stylesheet that
// started describing a compact composition at a different width would produce a
// layout the app's own state disagreed with — the strips hidden while JS thought
// it was wide, or a view stack with no media query to position it.
//
// jsdom applies no stylesheets and has no layout, so the composition cannot be
// asserted here; the declarations can. The stylesheets are read from disk, the
// way `scrollRegions.test.ts` reads them and for the same reason: vitest hands a
// CSS-module import back as a proxy of class names.

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { COMPACT_BREAKPOINT_PX, COMPACT_QUERY, matchesCompact } from './compact'

/** Every stylesheet under `src`, recursively, as `path -> source`. */
function stylesheets(dir: string): Record<string, string> {
  const found: Record<string, string> = {}
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) Object.assign(found, stylesheets(path))
    else if (entry.name.endsWith('.css')) found[path] = readFileSync(path, 'utf8')
  }
  return found
}

describe('the compact breakpoint is declared once', () => {
  const files = stylesheets('src')

  it('finds the stylesheets it is meant to check', () => {
    // A guard on the test itself: a moved or renamed directory must not let
    // this file pass by finding nothing.
    const names = Object.keys(files)
    expect(names.some((f) => f.endsWith('index.css'))).toBe(true)
    expect(names.some((f) => f.endsWith('StatusBar.module.css'))).toBe(true)
  })

  it('every width media query uses the shell breakpoint', () => {
    const widths = new Set<string>()
    for (const [file, css] of Object.entries(files)) {
      const source = css.replace(/\/\*[\s\S]*?\*\//g, '')
      for (const [, width] of source.matchAll(/@media[^{]*max-width:\s*(\d+)px/g)) {
        widths.add(width)
      }
      if (/@media[^{]*max-width:\s*[\d.]+(em|rem)/.test(source))
        throw new Error(`${file} declares a width breakpoint in font-relative units`)
    }
    // The shell has exactly one breakpoint. A second one would be a second
    // composition, which is a bigger decision than this test can hold.
    expect([...widths]).toEqual([String(COMPACT_BREAKPOINT_PX)])
  })

  it('describes the compact composition in the shell stylesheet', () => {
    const shell = Object.keys(files).find((f) => f.endsWith('index.css')) as string
    // The layers and the view switch are what the media query exists for; a
    // breakpoint with nothing behind it would mean the layout had moved and
    // left the declaration behind.
    expect(files[shell]).toContain('.view-layer')
    expect(files[shell]).toContain('layer-nav')
    expect(files[shell]).toContain('layer-meta')
  })

  it('the behavior query names the same width', () => {
    expect(COMPACT_QUERY).toBe(`(max-width: ${COMPACT_BREAKPOINT_PX}px)`)
  })
})

describe('matchesCompact', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is false where the platform has no media queries', () => {
    // jsdom ships no `matchMedia`, and its absence must mean the wide
    // composition: every test that does not stub it is asserting that.
    expect(matchesCompact()).toBe(false)
  })

  it('answers with the query it was built from', () => {
    const matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList)
    vi.stubGlobal('matchMedia', matchMedia)
    expect(matchesCompact()).toBe(true)
    expect(matchMedia).toHaveBeenCalledWith(COMPACT_QUERY)
  })

  it('answers false when the window is wider than the breakpoint', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false }) as MediaQueryList),
    )
    expect(matchesCompact()).toBe(false)
  })
})
