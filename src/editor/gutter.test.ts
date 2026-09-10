import { describe, expect, it } from 'vitest'
import { GUTTER_MARKER_HEIGHT, numberOffset, updateGutterDom } from './gutter'

const prose = (
  blockTop: number,
  blockHeight = 24,
  line: { top: number; height: number } | null = null,
) => ({ block: { top: blockTop, height: blockHeight }, line, isCodeBlock: false }) as const

describe('numberOffset', () => {
  it('centres a prose number on the block first text line', () => {
    // (24 - 12) / 2 = 6 below the line's top, relative to the gutter's top.
    expect(numberOffset(prose(200, 24, { top: 200, height: 24 }), 50)).toBe(156)
  })

  it('centres on a taller line box, which is why the line is measured at all', () => {
    expect(numberOffset(prose(200, 40, { top: 202, height: 32 }), 50)).toBe(162)
  })

  it('falls back to the block box when the block has no text line', () => {
    // An empty placeholder block: the block box, centred, exactly as before the
    // gutter was split into two passes.
    expect(numberOffset(prose(200, 24, null), 50)).toBe(156)
    expect(numberOffset(prose(200, 40, null), 50)).toBe(164)
  })

  it('pins a code block to the panel top edge instead of centring', () => {
    const code = {
      block: { top: 300, height: 400 },
      line: { top: 340, height: 20 },
      isCodeBlock: true,
    }
    expect(numberOffset(code, 50)).toBe(250)
  })

  it('honours a custom marker height', () => {
    expect(numberOffset(prose(200, 24, { top: 200, height: 24 }), 50, 20)).toBe(152)
    expect(GUTTER_MARKER_HEIGHT).toBe(12)
  })
})

// The ordering guard (design D4): the requirement is that an update never
// interleaves a layout read with a style write per block, and ordering is
// stable where a millisecond threshold is not.
describe('updateGutterDom ordering', () => {
  const withSpies = (run: () => void) => {
    const log: string[] = []
    const undo: (() => void)[] = []
    const spy = (target: object, name: string, label: string) => {
      const original = Reflect.get(target, name) as ((...args: never[]) => unknown) | undefined
      if (typeof original !== 'function') return // jsdom lacks Range.getClientRects
      Reflect.set(target, name, function (this: unknown, ...args: never[]) {
        log.push(label)
        return original.apply(this, args)
      })
      undo.push(() => Reflect.set(target, name, original))
    }
    spy(Element.prototype, 'getBoundingClientRect', 'read')
    spy(Range.prototype, 'getClientRects', 'read')
    spy(Element.prototype, 'replaceChildren', 'write')
    spy(Node.prototype, 'appendChild', 'write')
    try {
      run()
    } finally {
      for (const restore of undo.reverse()) restore()
    }
    return log
  }

  it('reads every block before writing any number', () => {
    const host = document.createElement('div')
    const prose = document.createElement('p')
    prose.textContent = 'prose'
    const list = document.createElement('ul')
    list.appendChild(document.createElement('li'))
    const code = document.createElement('div')
    code.className = 'milkdown-code-block'

    let children = 0
    const log = withSpies(() => {
      updateGutterDom(host, [prose, list, code], [1, 3, 5], 'num')
      children = host.children.length
    })

    const firstWrite = log.indexOf('write')
    expect(firstWrite).toBeGreaterThan(-1)
    expect(log.lastIndexOf('read')).toBeLessThan(firstWrite)
    // One measurement pass and nothing more: the host box plus one read per
    // block. jsdom has no Range.getClientRects, so the first-line reads that a
    // browser makes are absent here.
    expect(log.filter((entry) => entry === 'read')).toHaveLength(4)
    expect(children).toBe(3)
    expect([...host.children].map((span) => span.textContent)).toEqual(['1', '3', '5'])
  })
})
