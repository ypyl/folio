// The located block's frame (frame-the-located-block; DESIGN.md — Search match).
//
// jsdom has no layout, so the claims this rule exists for — "the frame moves
// nothing" and "a long wrapped line does not re-wrap" — cannot be asserted in a
// test. The declarations can: a frame drawn with a border, padding, or a margin
// would reflow the text and violate the requirement, and a reintroduced fill or
// fade would bring back the mark this change replaced. Both fail here rather
// than showing up in a browser.
//
// The frame is painted by an absolutely positioned overlay, which is the part
// that was wrong first: an inset shadow on the line itself sits under the line's
// content, so a fenced block's fill hid the vertical edges wherever the text
// was, and the frame read as a dashed outline. The overlay assertions below pin
// what makes the frame whole.
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

/** Every rule as its selector and its declarations. */
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
  selector: match[1].trim(),
  body: match[2],
}))

/** The declarations of every rule whose selector mentions `name`. */
function rulesFor(name: string): string[] {
  return rules.filter((rule) => rule.selector.includes(`.${name}`)).map((rule) => rule.body)
}

/** The declarations of the overlay rules, which are the ones that paint. */
function overlayRules(name: string): string[] {
  return rules
    .filter((rule) => rule.selector.includes(`.${name}`) && rule.selector.includes('::after'))
    .map((rule) => rule.body)
}

describe('the located block frame', () => {
  it('paints the frame above the content, not under it', () => {
    const overlay = overlayRules('folio-search-hit').join('\n')
    expect(overlay).toContain('position: absolute')
    expect(overlay).toContain('box-shadow')
    expect(overlay).toContain('inset')
    expect(overlay).toContain('var(--brand)')
    // An overlay that took pointer events would swallow clicks on a table's or
    // an image's own controls inside the frame.
    expect(overlay).toContain('pointer-events: none')
    // The overlay needs a positioned ancestor on the line it belongs to.
    expect(rulesFor('folio-search-hit').join('\n')).toContain('position: relative')
  })

  it('insets the frame past the line, so the text has room and the sides join', () => {
    const overlay = overlayRules('folio-search-hit').join('\n')
    // A negative inset is what gives the frame its breathing room and makes
    // adjacent lines' side edges overlap into one continuous edge.
    expect(overlay).toMatch(/inset:\s*-\d/)
  })

  it('gives the ends their horizontal edge and their radius', () => {
    expect(rulesFor('folio-search-hit-first').join('\n')).toContain('--folio-frame-top')
    expect(rulesFor('folio-search-hit-last').join('\n')).toContain('--folio-frame-bottom')
    expect(overlayRules('folio-search-hit-first').join('\n')).toContain('border-top-left-radius')
    expect(overlayRules('folio-search-hit-last').join('\n')).toContain('border-bottom-left-radius')
  })

  it('adds no layout of its own', () => {
    for (const rule of rules.filter((rule) => rule.selector.includes('.folio-search-hit'))) {
      for (const property of [
        'border:',
        'border-top:',
        'border-left:',
        'border-width',
        'padding',
        'margin',
      ]) {
        expect(rule.body, `${rule.selector} must not set ${property}`).not.toContain(property)
      }
    }
  })

  it('frames a table widget with an outline, which joins no layout', () => {
    // A table's lines are replaced by the widget, so the frame rides on the
    // table itself: an outline paints outside the box, so the table's grid and
    // its column widths stay where they were.
    const rule = rules.find((entry) => entry.selector.includes('.folio-table-framed'))
    expect(rule).toBeDefined()
    expect(rule?.body).toContain('outline: 1px solid var(--brand)')
    // `border-radius` is paint-only, so it is allowed; a border, padding, or a
    // margin would resize the table and re-wrap its cells.
    for (const property of ['border:', 'border-width', 'padding', 'margin', 'width']) {
      expect(rule?.body, `the table frame must not set ${property}`).not.toContain(property)
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
