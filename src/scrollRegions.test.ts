// The scroll-region rule from DESIGN.md (steady-scroll-regions): every scroll
// region the app owns reserves its scrollbar's gutter, so content keeps its
// width as a region crosses the overflow threshold.
//
// jsdom has no layout, so the scenario this rule exists for — "the text does not
// move when the scrollbar appears" — cannot be asserted in a test. The rule
// itself can: a new `overflow: auto` that forgets its gutter fails here instead
// of showing up as a reflow in a browser.
//
// The stylesheets are read from disk, which is the only way to see a
// declaration: vitest replaces a CSS-module import with a proxy of class names.
// Reading files is a test-only concern — nothing the app ships touches the
// filesystem (`node:fs` is typed here for this file, and the app has no other
// use for it).

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** Selectors that deliberately reserve nothing, because their content is sized
 *  to their own fixed extent and a lane would shrink it (design D3): the folder
 *  rail's controls are a fixed size in a fixed-width column, and the code
 *  block's language list is an overlay whose width comes from its content. */
const OPT_OUTS = ['.rail', '.language-list'] as const

const isOptOut = (selector: string) => OPT_OUTS.some((s) => selector.includes(s))

/** Every `.module.css` under `src`, recursively, as `path -> source`. */
function stylesheets(dir: string): Record<string, string> {
  const found: Record<string, string> = {}
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) Object.assign(found, stylesheets(path))
    else if (entry.name.endsWith('.module.css')) found[path] = readFileSync(path, 'utf8')
  }
  return found
}

/** Each rule as `[selector, body]`. The stylesheets are flat (no at-rule nests
 *  a rule inside another), so a brace-delimited scan is enough. */
function rules(css: string): [string, string][] {
  const out: [string, string][] = []
  for (const [, prelude, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const lines = prelude.split('\n').filter((line) => line.trim() !== '')
    out.push([(lines[lines.length - 1] ?? '').trim(), body])
  }
  return out
}

const strips = (body: string) => body.replace(/\s+/g, '')

describe('scroll regions reserve their gutter (steady-scroll-regions)', () => {
  const files = stylesheets('src')

  it('finds the stylesheets it is meant to check', () => {
    // A guard on the test itself: a moved or renamed directory must not let
    // this file pass by finding nothing.
    const names = Object.keys(files)
    expect(names.length).toBeGreaterThan(8)
    expect(names.some((f) => f.includes('Sidebar.module.css'))).toBe(true)
  })

  it('every scroll region the app owns reserves its scrollbar gutter', () => {
    const missing: string[] = []
    for (const [file, css] of Object.entries(files)) {
      for (const [selector, body] of rules(css)) {
        if (!/overflow(-y)?:\s*auto/.test(body)) continue
        if (isOptOut(selector)) continue
        if (!strips(body).includes('scrollbar-gutter:stable'))
          missing.push(`${file} :: ${selector}`)
      }
    }
    expect(missing).toEqual([])
  })

  it('the two opt-outs reserve nothing, so their content keeps its size', () => {
    const reserved: string[] = []
    for (const [file, css] of Object.entries(files)) {
      for (const [selector, body] of rules(css)) {
        if (!isOptOut(selector)) continue
        if (/overflow(-y)?:\s*auto/.test(body) && strips(body).includes('scrollbar-gutter:stable'))
          reserved.push(`${file} :: ${selector}`)
      }
    }
    // A gutter here would take the rail's 44px content box to about 29px and
    // clip its 40px avatars, and would move the popup's content-sized edge.
    expect(reserved).toEqual([])
  })
})
