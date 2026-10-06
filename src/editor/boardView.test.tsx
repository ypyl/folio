import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { useEffect, type ReactNode } from 'react'
import { act, render, screen } from '@testing-library/react'
import { BoardView } from './boardView'

// The board host is mocked away in every App test, so nothing exercised the
// real component. Here the Excalidraw package is mocked instead and the host
// is driven directly: its lazy load, the parsed initial scene, the app's main
// menu, and the "only element changes save" rule through its onChange stream.
const excalidraw = vi.hoisted(() => ({ props: null as Record<string, unknown> | null }))
const serializeAsJSON = vi.hoisted(() => vi.fn(() => '{"type":"excalidraw","elements":[]}'))

vi.mock('@excalidraw/excalidraw', () => {
  const Item = () => null
  const Excalidraw = (props: Record<string, unknown>) => {
    // Capture after commit, not during render, so the render body stays pure.
    useEffect(() => {
      excalidraw.props = props
    })
    return <div data-testid="excalidraw">{props.children as ReactNode}</div>
  }
  const MainMenu = Object.assign(
    ({ children }: { children?: ReactNode }) => <div data-testid="main-menu">{children}</div>,
    {
      DefaultItems: {
        LoadScene: Item,
        SaveToActiveFile: Item,
        Export: Item,
        SaveAsImage: Item,
        SearchMenu: Item,
        Help: Item,
        ClearCanvas: Item,
        ToggleTheme: Item,
        ChangeCanvasBackground: Item,
      },
      Separator: Item,
    },
  )
  return { Excalidraw, MainMenu, serializeAsJSON }
})

vi.mock('@excalidraw/excalidraw/index.css', () => ({}))

const change = (elements: { id: string; version?: number }[], tool: string) => {
  const onChange = excalidraw.props!.onChange as (
    elements: unknown[],
    appState: unknown,
    files: unknown,
  ) => void
  onChange(elements, { activeTool: { type: tool } }, {})
}

beforeEach(() => {
  serializeAsJSON.mockClear()
  excalidraw.props = null
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('BoardView', () => {
  it('shows a loading placeholder until the editor module resolves', () => {
    const { container } = render(
      <BoardView initialScene="" boardToken={null} onChange={() => {}} />,
    )
    expect(container.querySelector('[data-board-loading]')).toBeTruthy()
  })

  it('mounts the editor with the parsed scene and the app menu', async () => {
    render(
      <BoardView
        initialScene='{"elements":[{"id":"a"}],"appState":{"viewBackgroundColor":"#fffce8"}}'
        boardToken={null}
        onChange={() => {}}
      />,
    )
    await screen.findByTestId('excalidraw')
    const initialData = excalidraw.props!.initialData as {
      elements: unknown[]
      appState: Record<string, unknown>
    }
    expect(initialData.elements).toEqual([{ id: 'a' }])
    expect(initialData.appState.viewBackgroundColor).toBe('#fffce8')
    expect(screen.getByTestId('main-menu')).toBeTruthy()
  })

  it('opens a blank board on the app parchment background', async () => {
    render(<BoardView initialScene="" boardToken={null} onChange={() => {}} />)
    await screen.findByTestId('excalidraw')
    const initialData = excalidraw.props!.initialData as { appState: Record<string, unknown> }
    expect(initialData.appState.viewBackgroundColor).toBe('#f5f4ed')
  })

  it('toggles the crosshair with the tool and saves only a changed element set', async () => {
    const { container } = render(
      <BoardView initialScene="" boardToken={null} onChange={() => {}} />,
    )
    await screen.findByTestId('excalidraw')
    const host = container.querySelector('[data-board-host]') as HTMLElement

    // The mount's own load is the first emit: it sets the baseline, no save.
    act(() => change([{ id: 'a', version: 1 }], 'rectangle'))
    expect(serializeAsJSON).not.toHaveBeenCalled()
    expect(host.hasAttribute('data-crosshair')).toBe(true)

    // A camera move keeps the signature: the crosshair follows the tool but
    // nothing is written.
    act(() => change([{ id: 'a', version: 1 }], 'selection'))
    expect(serializeAsJSON).not.toHaveBeenCalled()
    expect(host.hasAttribute('data-crosshair')).toBe(false)

    // A real element change bumps the version and saves the scene.
    act(() => change([{ id: 'a', version: 2 }], 'selection'))
    expect(serializeAsJSON).toHaveBeenCalledTimes(1)
  })

  it('shows the reference token on a blank board and clears it on the first element', async () => {
    const { container } = render(
      <BoardView initialScene="" boardToken="#![[Architecture]]" onChange={() => {}} />,
    )
    await screen.findByTestId('excalidraw')
    const note = container.querySelector('[data-board-note]')
    expect(note?.textContent).toContain('#![[Architecture]]')

    // The mount's own emit carries no elements, so the note stays.
    act(() => change([], 'selection'))
    expect(container.querySelector('[data-board-note]')).toBeTruthy()

    // The first element clears it, and it never returns for this open board.
    act(() => change([{ id: 'a', version: 1 }], 'rectangle'))
    expect(container.querySelector('[data-board-note]')).toBeNull()
    act(() => change([], 'selection'))
    expect(container.querySelector('[data-board-note]')).toBeNull()
  })

  it('shows no note on a board that already holds elements', async () => {
    const { container } = render(
      <BoardView
        initialScene='{"elements":[{"id":"a"}],"appState":{}}'
        boardToken="#!Roadmap"
        onChange={() => {}}
      />,
    )
    await screen.findByTestId('excalidraw')
    expect(container.querySelector('[data-board-note]')).toBeNull()
  })

  it('describes the reference without a token when the name has no token form', async () => {
    const { container } = render(
      <BoardView initialScene="" boardToken={null} onChange={() => {}} />,
    )
    await screen.findByTestId('excalidraw')
    const note = container.querySelector('[data-board-note]')
    expect(note?.textContent).toContain('#! token')
    expect(note?.textContent).not.toContain('#![')
  })
})

// jsdom has no layout and vitest replaces a CSS-module import with a proxy, so
// the applied rule cannot be read from the DOM. The stylesheet is read from
// disk instead — the same approach as the scroll-region rules test — to pin
// the two properties the note depends on: it takes no pointer input, and it is
// a filled surface rather than an outlined one (DESIGN.md). The real click
// behaviour is checked in the browser (task 3.1).
describe('blank board note styles', () => {
  const css = readFileSync('src/editor/boardView.module.css', 'utf8')
  const rule = css.replace(/\/\*[\s\S]*?\*\//g, '').match(/\.blankNote\s*\{([^}]*)\}/)?.[1] ?? ''

  it('takes no pointer input', () => {
    expect(rule.replace(/\s+/g, '')).toContain('pointer-events:none')
  })

  it('is carried by its fill, not a closed border', () => {
    expect(rule).not.toMatch(/border:/)
    expect(rule).toMatch(/background:/)
  })
})
