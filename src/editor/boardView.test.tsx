import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
    const { container } = render(<BoardView initialScene="" onChange={() => {}} />)
    expect(container.querySelector('[data-board-loading]')).toBeTruthy()
  })

  it('mounts the editor with the parsed scene and the app menu', async () => {
    render(
      <BoardView
        initialScene='{"elements":[{"id":"a"}],"appState":{"viewBackgroundColor":"#fffce8"}}'
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
    render(<BoardView initialScene="" onChange={() => {}} />)
    await screen.findByTestId('excalidraw')
    const initialData = excalidraw.props!.initialData as { appState: Record<string, unknown> }
    expect(initialData.appState.viewBackgroundColor).toBe('#f5f4ed')
  })

  it('toggles the crosshair with the tool and saves only a changed element set', async () => {
    const { container } = render(<BoardView initialScene="" onChange={() => {}} />)
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
})
