import { StrictMode } from 'react'
import { act, render, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { EditorPane } from '../components/EditorPane'
import type { Page } from '../page'

// Regression tests for the StrictMode mount race (design D3, fix-editor-mount-race):
// MilkdownAdapter.mount awaits Editor.create(), so a destroy() issued while create()
// is in flight must tear the pending editor down, never leak a second .milkdown root.

const pageA: Page = { path: 'a.md', title: 'A', kind: 'page', content: 'first page' }
const pageB: Page = { path: 'b.md', title: 'B', kind: 'page', content: 'second page' }

const settle = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 100))
  })

const roots = () => document.querySelectorAll('.milkdown').length
const proseMirror = () => document.querySelector('.ProseMirror')?.textContent ?? ''

it('StrictMode double-mount leaves exactly one seeded editor', async () => {
  render(
    <StrictMode>
      <EditorPane page={pageA} initialContent="first page" onChange={() => {}} />
    </StrictMode>,
  )
  await settle()
  expect(roots()).toBe(1)
  expect(proseMirror()).toContain('first page')
})

it('an immediate page switch while the first mount is initializing leaves one editor', async () => {
  const { rerender } = render(
    <EditorPane key="a" page={pageA} initialContent="first page" onChange={() => {}} />,
  )
  // Switch before the first editor's async create() can settle: cleanup's
  // destroy() runs while mount() is still awaiting, which is the race.
  rerender(<EditorPane key="b" page={pageB} initialContent="second page" onChange={() => {}} />)
  await settle()
  expect(roots()).toBe(1)
  expect(proseMirror()).toContain('second page')
})

it('unmounting while the first mount is initializing leaves no editor behind', async () => {
  const { unmount } = render(
    <EditorPane page={pageA} initialContent="first page" onChange={() => {}} />,
  )
  unmount()
  await settle()
  expect(roots()).toBe(0)
})

// fit-vault-images-to-pane: the node view is registered by the real adapter, and
// the pane's resolution pass still finds the element inside it. This is the one
// place both run for real; the pane's own tests drive the fake seam.
it('renders a vault image in the fit wrapper with its control, resolved to the bytes', async () => {
  const readAsset = async () => new Blob(['bytes'], { type: 'image/png' })
  render(
    <EditorPane
      page={pageA}
      initialContent="![photo](assets/photo.png)"
      onChange={() => {}}
      readAsset={readAsset}
    />,
  )
  await settle()
  const wrapper = document.querySelector('.folio-image')
  expect(wrapper).not.toBeNull()
  const img = wrapper?.querySelector('img')
  await waitFor(() => expect(img?.getAttribute('src') ?? '').toMatch(/^blob:/))
  expect(wrapper?.querySelector('button')?.getAttribute('aria-label')).toBe('Expand image')
})
