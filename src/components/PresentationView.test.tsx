import { readFileSync } from 'node:fs'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PresentationView } from './PresentationView'

afterEach(() => {
  vi.restoreAllMocks()
})

// jsdom 30 has no <dialog> modal API, so showModal() never sets the `open`
// attribute and every role query treats the dialog as hidden. Stub the two
// methods so the component's real open/close path runs in the test.
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
  configurable: true,
  writable: true,
  value(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  },
})
Object.defineProperty(HTMLDialogElement.prototype, 'close', {
  configurable: true,
  writable: true,
  value(this: HTMLDialogElement) {
    this.removeAttribute('open')
  },
})

const slides = ['<h1>Intro</h1>', '<p>Talk</p>', '<p>End</p>']

describe('PresentationView (add-presentations)', () => {
  it('shows the first slide, its position, and named controls', () => {
    render(<PresentationView slides={slides} onClose={() => {}} />)
    const dialog = screen.getByRole('dialog', { name: 'Presentation' })
    expect(within(dialog).getByRole('heading', { name: 'Intro' })).toBeTruthy()
    expect(within(dialog).getByText('1 / 3')).toBeTruthy()
    expect(within(dialog).getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1')
    expect(within(dialog).getByRole('button', { name: 'Previous slide' })).toBeTruthy()
    expect(within(dialog).getByRole('button', { name: 'Next slide' })).toBeTruthy()
    expect(within(dialog).getByRole('button', { name: 'Close presentation' })).toBeTruthy()
  })

  it('moves with the on-screen controls and reports position', () => {
    render(<PresentationView slides={slides} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }))
    expect(screen.getByText('2 / 3')).toBeTruthy()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('2')
    fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }))
    expect(screen.getByText('1 / 3')).toBeTruthy()
  })

  it('leaves through the close control', () => {
    const onClose = vi.fn()
    render(<PresentationView slides={slides} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close presentation' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('leaves when the dialog is cancelled (Escape)', () => {
    const onClose = vi.fn()
    render(<PresentationView slides={slides} onClose={onClose} />)
    fireEvent(
      screen.getByRole('dialog', { name: 'Presentation' }),
      new Event('cancel', { bubbles: true, cancelable: true }),
    )
    expect(onClose).toHaveBeenCalled()
  })

  it('navigates by keyboard, without wrapping at the ends', () => {
    render(<PresentationView slides={slides} onClose={() => {}} />)
    const dialog = screen.getByRole('dialog', { name: 'Presentation' })
    fireEvent.keyDown(dialog, { key: 'ArrowRight' })
    expect(screen.getByText('2 / 3')).toBeTruthy()
    fireEvent.keyDown(dialog, { key: 'ArrowLeft' })
    expect(screen.getByText('1 / 3')).toBeTruthy()
    // At the first slide, backward does nothing.
    fireEvent.keyDown(dialog, { key: 'ArrowLeft' })
    expect(screen.getByText('1 / 3')).toBeTruthy()
    // End jumps to the last, Home back to the first, and End does not wrap.
    fireEvent.keyDown(dialog, { key: 'End' })
    expect(screen.getByText('3 / 3')).toBeTruthy()
    fireEvent.keyDown(dialog, { key: 'ArrowRight' })
    expect(screen.getByText('3 / 3')).toBeTruthy()
    fireEvent.keyDown(dialog, { key: 'Home' })
    expect(screen.getByText('1 / 3')).toBeTruthy()
  })

  it('toggles fullscreen on F without leaving the deck', () => {
    render(<PresentationView slides={slides} onClose={() => {}} />)
    const dialog = screen.getByRole('dialog', { name: 'Presentation' }) as HTMLDialogElement
    const request = vi.fn().mockResolvedValue(undefined)
    dialog.requestFullscreen = request
    fireEvent.keyDown(dialog, { key: 'f' })
    expect(request).toHaveBeenCalled()
    // Still present and navigable.
    expect(screen.getByText('1 / 3')).toBeTruthy()
  })

  it('stays usable when the browser refuses fullscreen', () => {
    render(<PresentationView slides={slides} onClose={() => {}} />)
    const dialog = screen.getByRole('dialog', { name: 'Presentation' }) as HTMLDialogElement
    dialog.requestFullscreen = vi.fn().mockRejectedValue(new Error('refused'))
    fireEvent.keyDown(dialog, { key: 'f' })
    expect(screen.getByText('1 / 3')).toBeTruthy()
  })

  it('resolves vault images and releases them on close', async () => {
    const read = vi.fn().mockResolvedValue(new Blob(['x'], { type: 'image/png' }))
    const { unmount } = render(
      <PresentationView
        slides={['<p><img src="assets/photo.png" alt="photo" /></p>']}
        onClose={() => {}}
        readAsset={read}
      />,
    )
    const img = await waitFor(() => {
      const el = screen.getByRole('dialog').querySelector('img')
      expect(el).not.toBeNull()
      return el as HTMLImageElement
    })
    await waitFor(() => expect(read).toHaveBeenCalledWith('assets/photo.png'))
    await waitFor(() => expect(img.getAttribute('src')).toMatch(/^blob:/))
    const url = img.getAttribute('src')
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    unmount()
    expect(revoke.mock.calls.map(([u]) => u)).toContain(url)
  })
})

// The deck's stylesheet reuses the app's Kami tokens (design D7). jsdom has no
// layout, so the rules themselves are read from disk: no literal colors and no
// shadows, and the slide scrolls within itself rather than the page.
describe('PresentationView stylesheet (add-presentations)', () => {
  const css = readFileSync('src/components/PresentationView.module.css', 'utf8')

  it('uses only the app tokens, with no literal colors or shadows', () => {
    expect(css).toContain('var(--parchment)')
    expect(css).toContain('var(--near-black)')
    expect(css).toContain('var(--brand)')
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toMatch(/box-shadow\s*:/)
  })

  it('scrolls a tall slide within itself', () => {
    expect(css).toMatch(/\.slide\s*\{[^}]*overflow-y:\s*auto/s)
  })
})
