// The diagram runtime (add-mermaid-diagrams, design D2-D5): the readable rule,
// the one-at-a-time queue, the cache keyed by source text, the failure verdict,
// and the release. Driven through the injected engine and observer, so no
// browser, no layout, and no real mermaid are needed.

import { describe, expect, it, vi } from 'vitest'
import { createDiagrams, isDiagram, type Observatory } from './diagrams'

/** A stand-in engine that records what it was asked to draw and how many calls
 *  were in flight at once. */
function fakeEngine(answers: (source: string) => string | Error) {
  const calls: string[] = []
  let inFlight = 0
  let peak = 0
  const render = vi.fn(async (_id: string, source: string) => {
    calls.push(source)
    inFlight += 1
    peak = Math.max(peak, inFlight)
    // Let the other queue (a second runtime) run if serialization is missing.
    await new Promise((resolve) => setTimeout(resolve, 0))
    inFlight -= 1
    const answer = answers(source)
    if (answer instanceof Error) throw answer
    return answer
  })
  return { render, calls, peak: () => peak }
}

/** An observer whose verdict the test sets, so "in view" is a choice. */
function fakeObserver(visible = true) {
  const observed = new Set<Element>()
  const observers: Observatory[] = []
  const factory = (callback: (target: Element, intersecting: boolean) => void) => {
    const entry: Observatory = {
      observe: (target) => {
        observed.add(target)
        if (visible) callback(target, true)
      },
      unobserve: (target) => observed.delete(target),
      disconnect: () => observed.clear(),
    }
    observers.push(entry)
    return entry
  }
  return { factory, observed, observers }
}

const FLOW = '```mermaid\nflowchart TD\n  A --> B\n```'

describe('what draws', () => {
  it('draws only a mermaid fence with a body', () => {
    expect(isDiagram('mermaid', 'flowchart TD\n A --> B')).toBe(true)
    expect(isDiagram('Mermaid', 'flowchart TD')).toBe(true)
    expect(isDiagram('  mermaid  ', 'flowchart TD')).toBe(true)
  })

  it('leaves every other fence, and an empty one, as source', () => {
    expect(isDiagram('js', 'const a = 1')).toBe(false)
    expect(isDiagram(null, 'const a = 1')).toBe(false)
    expect(isDiagram('mermaid', '')).toBe(false)
    expect(isDiagram('mermaid', '   \n\n  ')).toBe(false)
    expect(isDiagram('mermaidjs', 'flowchart TD')).toBe(false)
  })
})

describe('a drawing is filled in once per source', () => {
  it('draws a source and fills every box showing it', async () => {
    const engine = fakeEngine(() => '<svg id="drawn"></svg>')
    const observer = fakeObserver()
    const diagrams = createDiagrams({ engine, observer: observer.factory })
    const first = document.createElement('figure')
    const second = document.createElement('figure')

    diagrams.register(FLOW, first)
    diagrams.register(FLOW, second)
    await vi.waitFor(() => expect(first.innerHTML).toContain('drawn'))

    expect(engine.calls).toEqual([FLOW])
    expect(second.innerHTML).toContain('drawn')
    expect(first.dataset.state).toBe('drawn')
    diagrams.release()
  })

  it('draws nothing for a box that is not in view', async () => {
    const engine = fakeEngine(() => '<svg></svg>')
    const observer = fakeObserver(false)
    const diagrams = createDiagrams({ engine, observer: observer.factory })
    const box = document.createElement('figure')

    diagrams.register(FLOW, box)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(engine.calls).toEqual([])
    expect(box.innerHTML).toBe('')
    diagrams.release()
  })

  it('does not draw again when the same box registers again', async () => {
    const engine = fakeEngine(() => '<svg></svg>')
    const observer = fakeObserver()
    const diagrams = createDiagrams({ engine, observer: observer.factory })
    const box = document.createElement('figure')

    diagrams.register(FLOW, box)
    await vi.waitFor(() => expect(box.dataset.state).toBe('drawn'))
    diagrams.register(FLOW, box)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(engine.calls).toHaveLength(1)
    diagrams.release()
  })
})

describe('the engine is asked one drawing at a time', () => {
  it('serializes two runtimes sharing the engine', async () => {
    const engine = fakeEngine((source) => `<svg>${source.length}</svg>`)
    const observer = fakeObserver()
    const one = createDiagrams({ engine, observer: observer.factory })
    const two = createDiagrams({ engine, observer: observer.factory })
    const first = document.createElement('figure')
    const second = document.createElement('figure')

    one.register(FLOW, first)
    two.register(`${FLOW}\n`, second)
    await vi.waitFor(() => expect(second.dataset.state).toBe('drawn'))

    expect(engine.calls).toHaveLength(2)
    expect(engine.peak()).toBe(1)
    one.release()
    two.release()
  })
})

describe('a source the engine refuses', () => {
  it('shows the source and says so, and is not retried', async () => {
    const engine = fakeEngine(() => new Error('bad diagram'))
    const observer = fakeObserver()
    const diagrams = createDiagrams({ engine, observer: observer.factory })
    const box = document.createElement('figure')

    diagrams.register(FLOW, box)
    await vi.waitFor(() => expect(box.dataset.state).toBe('failed'))

    expect(box.querySelector('.folio-diagram-source')?.textContent).toBe(FLOW)
    expect(box.querySelector('.folio-diagram-note')?.textContent).toContain('could not be drawn')

    const again = document.createElement('figure')
    diagrams.register(FLOW, again)
    expect(again.dataset.state).toBe('failed')
    expect(engine.calls).toHaveLength(1)
    diagrams.release()
  })
})

describe('releasing a drawing', () => {
  it('drops the drawing when its last box leaves, and draws it again later', async () => {
    const engine = fakeEngine(() => '<svg id="again"></svg>')
    const observer = fakeObserver()
    const diagrams = createDiagrams({ engine, observer: observer.factory })
    const box = document.createElement('figure')

    diagrams.register(FLOW, box)
    await vi.waitFor(() => expect(box.dataset.state).toBe('drawn'))
    diagrams.unregister(box)
    expect(observer.observed.size).toBe(0)

    const later = document.createElement('figure')
    diagrams.register(FLOW, later)
    await vi.waitFor(() => expect(later.innerHTML).toContain('again'))
    expect(engine.calls).toHaveLength(2)
    diagrams.release()
  })
})

describe('the deck pass', () => {
  it('replaces a mermaid fence with the block that draws it', async () => {
    const engine = fakeEngine(() => '<svg id="slide"></svg>')
    const observer = fakeObserver()
    const diagrams = createDiagrams({ engine, observer: observer.factory })
    const host = document.createElement('div')
    host.innerHTML =
      '<p>before</p><pre><code class="language-mermaid">flowchart TD\n A --> B</code></pre>'

    diagrams.sync(host)
    await vi.waitFor(() => expect(host.innerHTML).toContain('slide'))

    expect(host.querySelector('pre')).toBeNull()
    expect(host.querySelector('figure.folio-diagram')?.innerHTML).toContain('slide')
    diagrams.release()
  })

  it('leaves another language, and an empty mermaid fence, as source', () => {
    const engine = fakeEngine(() => '<svg></svg>')
    const observer = fakeObserver()
    const diagrams = createDiagrams({ engine, observer: observer.factory })
    const host = document.createElement('div')
    host.innerHTML =
      '<pre><code class="language-js">const a = 1</code></pre><pre><code class="language-mermaid">   </code></pre>'

    diagrams.sync(host)

    expect(host.querySelectorAll('pre')).toHaveLength(2)
    expect(engine.calls).toEqual([])
    diagrams.release()
  })
})
