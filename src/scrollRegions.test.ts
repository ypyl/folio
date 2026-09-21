// The scroll-region rules from DESIGN.md (steady-scroll-regions and
// always-visible-scrollbars): every scroll region the app owns reserves its
// scrollbar's gutter, and every region that reserves one carries the app's own
// bar in it — a thin inset pill, shown for as long as the region can scroll.
//
// jsdom has no layout, so the scenarios these rules exist for — "the text does
// not move when the scrollbar appears" and "the bar is shown only while there
// is overflow" — cannot be asserted in a test. The rules themselves can: a new
// `overflow: auto` that forgets its gutter, or a region that keeps the platform
// bar where every other one carries the app's thumb, fails here instead of
// showing up in a browser.
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
 *  block's language list is an overlay whose width comes from its content. A
 *  region that opts out of the gutter opts out of the app's thumb too. */
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

/** Each rule's selectors as `[selector, body]`, one entry per selector in a
 *  comma-separated list. Comments are stripped first, then the stylesheets are
 *  flat (no at-rule nests a rule inside another), so a brace-delimited scan is
 *  enough. */
function rules(css: string): [string, string][] {
  const out: [string, string][] = []
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const [, prelude, body] of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const selector of prelude.split(',')) {
      const trimmed = selector.trim()
      if (trimmed !== '') out.push([trimmed, body])
    }
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

describe("every gutter region carries the app's thumb (always-visible-scrollbars)", () => {
  const files = stylesheets('src')

  it('every scroll region the app owns carries the thumb recipe', () => {
    const wrong: string[] = []
    for (const [file, css] of Object.entries(files)) {
      const parsed = rules(css)
      const bySelector = new Map(parsed.map(([selector, body]) => [selector, strips(body)]))
      for (const [selector, body] of parsed) {
        if (!/overflow(-y)?:\s*auto/.test(body)) continue
        if (isOptOut(selector)) continue
        const base = bySelector.get(`${selector}::-webkit-scrollbar`)
        const thumb = bySelector.get(`${selector}::-webkit-scrollbar-thumb`) ?? ''
        // The lane must keep the platform's width (design D4), so an explicit
        // `width` on the opt-in rule is the one thing the recipe forbids.
        if (!base) wrong.push(`${file} :: ${selector} does not opt into the app scrollbar`)
        else if (base.includes('width:')) wrong.push(`${file} :: ${selector} resizes the lane`)
        if (!thumb.includes('background-color:var(--stone)'))
          wrong.push(`${file} :: ${selector} has no bar while it can scroll`)
        if (!thumb.includes('background-clip:content-box'))
          wrong.push(`${file} :: ${selector} has a bar that is not inset`)
        // The thumb's visibility is the region's overflow, never the pointer.
        if (bySelector.has(`${selector}:hover::-webkit-scrollbar-thumb`))
          wrong.push(`${file} :: ${selector} gates its thumb on hover`)
      }
    }
    expect(wrong).toEqual([])
  })

  it("the two opt-outs keep the platform's own bar", () => {
    const styled: string[] = []
    for (const [file, css] of Object.entries(files)) {
      for (const [selector] of rules(css)) {
        if (!isOptOut(selector)) continue
        if (selector.includes('::-webkit-scrollbar')) styled.push(`${file} :: ${selector}`)
      }
    }
    // Restyling a region that reserves no lane would only shrink or move the
    // content the opt-out exists to protect.
    expect(styled).toEqual([])
  })
})
