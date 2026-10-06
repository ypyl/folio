import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { Tour } from './Tour'
import { placeCard } from '../tour/place'

// The app tour (add-app-tour spec): state, focus, and the measurement wiring are
// checked here; the cut-out's real geometry needs a browser (jsdom has no
// layout), so it is held by the Playwright check in tests/e2e/workspace.spec.ts.

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        start
      </button>
      <Tour open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function start(): HTMLElement {
  fireEvent.click(screen.getByRole('button', { name: 'start' }))
  return screen.getByRole('dialog', { name: 'App tour' })
}

afterEach(() => {
  vi.restoreAllMocks()
  document.getElementById('folder-rail')?.remove()
})

describe('Tour', () => {
  it('renders nothing while closed', () => {
    const { container } = render(<Tour open={false} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('opens at the first step', () => {
    render(<Harness />)
    const card = start()
    expect(card.textContent).toContain('Your folders')
    expect(card.textContent).toContain('Step 1 of 5')
  })

  it('moves forward and back through the steps', () => {
    render(<Harness />)
    const card = start()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(card.textContent).toContain('Journal and Files')
    expect(card.textContent).toContain('Step 2 of 5')
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(card.textContent).toContain('Your folders')
  })

  it('disables Back on the first step and ends with Done on the last', () => {
    render(<Harness />)
    const card = start()
    expect(screen.getByRole('button', { name: 'Back' })).toHaveProperty('disabled', true)
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(card.textContent).toContain('Getting around')
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog', { name: 'App tour' })).toBeNull()
  })

  it('ends on Skip', () => {
    render(<Harness />)
    start()
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.queryByRole('dialog', { name: 'App tour' })).toBeNull()
  })

  it('ends on Escape', () => {
    render(<Harness />)
    const card = start()
    fireEvent.keyDown(card, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'App tour' })).toBeNull()
  })

  it('moves focus into the card and back to the control that opened it', () => {
    render(<Harness />)
    const opener = screen.getByRole('button', { name: 'start' })
    opener.focus()
    const card = start()
    expect(document.activeElement).toBe(card)
    fireEvent.keyDown(card, { key: 'Escape' })
    expect(document.activeElement).toBe(opener)
  })

  it('contains Tab within the card', () => {
    render(<Harness />)
    const card = start()
    const skip = screen.getByRole('button', { name: 'Skip' })
    const next = screen.getByRole('button', { name: 'Next' })
    skip.focus()
    fireEvent.keyDown(card, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(next)
    fireEvent.keyDown(card, { key: 'Tab' })
    expect(document.activeElement).toBe(skip)
  })

  it('still explains a step whose region is missing', async () => {
    render(<Harness />)
    const card = start()
    await waitFor(() => expect(card.style.top).not.toBe(''))
    expect(screen.getByTestId('tour-hole').style.width).toBe('0px')
    expect(card.textContent).toContain('Your folders')
  })

  it('highlights a measured region', async () => {
    const target = document.createElement('div')
    target.id = 'folder-rail'
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      left: 20,
      width: 56,
      height: 400,
      right: 76,
      bottom: 500,
      x: 20,
      y: 100,
      toJSON: () => ({}),
    } as DOMRect)
    document.body.appendChild(target)

    render(<Harness />)
    start()
    await waitFor(() => expect(screen.getByTestId('tour-hole').style.top).toBe('100px'))
    expect(screen.getByTestId('tour-hole').style.left).toBe('20px')
    expect(screen.getByTestId('tour-hole').style.width).toBe('56px')
  })

  it('measures only while open', () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    render(<Harness />)
    start()
    const added = add.mock.calls.map((c) => c[0])
    expect(added).toContain('resize')
    expect(added).toContain('scroll')

    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    const removed = remove.mock.calls.map((c) => c[0])
    expect(removed).toContain('resize')
    expect(removed).toContain('scroll')
  })
})

describe('placeCard', () => {
  function viewport(w: number, h: number) {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(w)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(h)
  }

  it('places a card beside a side region', () => {
    viewport(1280, 800)
    const rect = { top: 0, left: 16, width: 56, height: 800 }
    expect(placeCard(rect, 'right', 320, 160)).toEqual({ top: 320, left: 84 })
  })

  it('flips a side that has no room', () => {
    viewport(1280, 800)
    const rect = { top: 0, left: 1100, width: 100, height: 800 }
    expect(placeCard(rect, 'right', 320, 160)).toEqual({ top: 320, left: 768 })
  })

  it('places a card above the status bar', () => {
    viewport(1280, 800)
    const rect = { top: 760, left: 400, width: 480, height: 40 }
    expect(placeCard(rect, 'top', 320, 160)).toEqual({ top: 588, left: 480 })
  })
})
