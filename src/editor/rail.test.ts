import { describe, expect, it } from 'vitest'
import { numberOffset, updateRailDom } from './rail'

const prose = (
  blockTop: number,
  blockHeight = 24,
  line: { top: number; height: number } | null = null,
) => ({ block: { top: blockTop, height: blockHeight }, line, pinToTop: false }) as const

describe('numberOffset', () => {
  it('centres a control on the first text line', () => {
    // Default marker height 14: (24 - 14) / 2 = 5 below the line's top,
    // relative to the rail's top.
    expect(numberOffset(prose(200, 24, { top: 200, height: 24 }), 50)).toBe(155)
  })

  it('centres on a taller line box, which is why the line is measured at all', () => {
    // 202 - 50 + (32 - 14) / 2 = 161.
    expect(numberOffset(prose(200, 40, { top: 202, height: 32 }), 50)).toBe(161)
  })

  it('falls back to the block box when the item has no text line', () => {
    expect(numberOffset(prose(200, 24, null), 50)).toBe(155)
    expect(numberOffset(prose(200, 40, null), 50)).toBe(163)
  })

  it('pins to the top edge instead of centring', () => {
    const pinned = {
      block: { top: 300, height: 400 },
      line: { top: 340, height: 20 },
      pinToTop: true,
    }
    expect(numberOffset(pinned, 50)).toBe(250)
  })

  it('honours a custom marker height', () => {
    expect(numberOffset(prose(200, 24, { top: 200, height: 24 }), 50, 20)).toBe(152)
  })
})

// The ordering guard: the rail is built with a read phase and a write phase, and
// ordering is stable where a millisecond threshold is not.
describe('updateRailDom ordering', () => {
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
    try {
      run()
    } finally {
      for (const restore of undo.reverse()) restore()
    }
    return log
  }

  const foldAt = (top: number, folded = false, depth = 1) => {
    const item = document.createElement('li')
    item.className = 'folio-fold-item'
    const head = document.createElement('p')
    head.className = 'folio-fold-head'
    head.textContent = 'A'
    item.appendChild(head)
    head.getBoundingClientRect = () => ({ top, height: 24 }) as DOMRect
    return { element: item, folded, depth }
  }

  it('reads every control before writing any', () => {
    const host = document.createElement('div')
    let children = 0
    const log = withSpies(() => {
      updateRailDom(host, [foldAt(200), foldAt(400)])
      children = host.children.length
    })
    const firstWrite = log.indexOf('write')
    expect(firstWrite).toBeGreaterThan(-1)
    expect(log.lastIndexOf('read')).toBeLessThan(firstWrite)
    expect(children).toBe(2)
  })
})

describe('fold controls on the rail', () => {
  const foldAt = (top: number, folded = false) => {
    const item = document.createElement('li')
    item.className = 'folio-fold-item'
    const head = document.createElement('p')
    head.className = 'folio-fold-head'
    head.textContent = 'A'
    item.appendChild(head)
    head.getBoundingClientRect = () => ({ top, height: 24 }) as DOMRect
    return { element: item, folded, depth: 1 }
  }

  it('places a control at the item first line', () => {
    const host = document.createElement('div')
    updateRailDom(host, [foldAt(200)])
    const arrow = host.querySelector<HTMLElement>('.folio-fold-arrow')
    // 200 + (24 - 14) / 2 = 205.
    expect(arrow?.style.top).toBe('205px')
  })

  it('labels a folded control with the action it performs', () => {
    const host = document.createElement('div')
    updateRailDom(host, [foldAt(100, true)])
    const arrow = host.querySelector<HTMLElement>('.folio-fold-arrow')
    expect(arrow?.getAttribute('aria-expanded')).toBe('false')
    expect(arrow?.getAttribute('aria-label')).toBe('Expand item')
    expect(arrow?.dataset.foldIndex).toBe('0')
  })

  it('clears the rail when there is nothing to place', () => {
    const host = document.createElement('div')
    updateRailDom(host, [foldAt(100)])
    expect(host.children.length).toBe(1)
    updateRailDom(host, [])
    expect(host.children.length).toBe(0)
  })
})
