// The located block's frame (frame-the-located-block; DESIGN.md — Search match).
//
// jsdom has no layout, so the claims this rule exists for — "the frame moves
// nothing" and "a long wrapped line does not re-wrap" — cannot be asserted in a
// test. The declarations can: a frame drawn with a border, padding, or a margin
// would reflow the text and violate the requirement, and a reintroduced fill or
// fade would bring back the mark this change replaced. Both fail here rather
// than showing up in a browser.
//
// The stylesheet is read from disk, which is the only way to see a declaration:
// vitest replaces a CSS-module import with a proxy of class names. Reading files
// is a test-only concern, and `src/scrollRegions.test.ts` reads the app's
// stylesheets for the same reason.

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Relative to the repo root, which is where vitest runs (as in
// `src/scrollRegions.test.ts`).
const css = readFileSync('src/components/EditorPane.module.css', 'utf8')

/** The declarations of every rule whose selector mentions `name`. */
function rulesFor(name: string): string[] {
  const blocks: string[] = []
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (match[1].includes(`.${name}`)) blocks.push(match[2])
  }
  return blocks
}

/** The declarations of the rules that mention `name` and nothing else besides
 *  the frame's own role classes, so a shared rule (a generic `.cm-line`) cannot
 *  answer for the frame. */
function ownRules(name: string): string[] {
  return rulesFor(name).filter(
    (block) => block.includes('--folio-frame') || block.includes('box-shadow'),
  )
}

describe('the located block frame', () => {
  it('draws its sides and its edges with inset shadows', () => {
    const base = rulesFor('folio-search-hit').join('\n')
    expect(base).toContain('box-shadow')
    expect(base).toContain('inset')
    expect(base).toContain('var(--brand)')
    // The two horizontal edges come from the role classes, so a one-line block
    // carries both and gets all four sides.
    expect(rulesFor('folio-search-hit-first').join('\n')).toContain('--folio-frame-top')
    expect(rulesFor('folio-search-hit-last').join('\n')).toContain('--folio-frame-bottom')
  })

  it('adds no layout of its own', () => {
    for (const block of ownRules('folio-search-hit')) {
      for (const property of [
        'border:',
        'border-top:',
        'border-left:',
        'border-width',
        'padding',
        'margin',
      ]) {
        expect(block, `the frame must not set ${property}`).not.toContain(property)
      }
    }
  })

  it('is a frame, not a fill that fades', () => {
    const all = rulesFor('folio-search-hit').join('\n')
    expect(all).not.toContain('background')
    expect(all).not.toContain('animation')
    expect(css).not.toContain('searchHitFade')
    expect(css).not.toContain('@keyframes searchHitFade')
  })

  it('names no file the app no longer has', () => {
    // The rule's comment used to point at src/editor/searchHighlight.ts, which
    // went with the editor swap.
    expect(css).not.toContain('searchHighlight')
  })
})
