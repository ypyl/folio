import { describe, expect, it } from 'vitest'
import type { Node as ProseNode } from '@milkdown/prose/model'
import { vaultImageNodeView } from './vaultImageView'

// fit-vault-images-to-pane: what the image node view renders, what it must not
// touch, and how the control toggles. The fit itself is CSS and is covered by
// the change's browser check, not here.

/** The node's shape the view reads: its type (compared on update) and its
 *  attributes. A real schema node would add nothing this view looks at. */
const IMAGE_TYPE = { name: 'image' }

const node = (attrs: Record<string, string>): ProseNode =>
  ({ type: IMAGE_TYPE, attrs }) as unknown as ProseNode

/** The members the image view provides, with the optionals the view always
 *  returns made required for the assertions. */
type ImageView = {
  dom: HTMLElement
  update: (node: ProseNode) => boolean
  stopEvent: (event: Event) => boolean
}

const open = vaultImageNodeView() as unknown as (node: ProseNode) => ImageView

const vaultAttrs = { src: 'assets/photo.png', alt: 'photo', title: '' }

describe('vaultImageNodeView', () => {
  it('wraps a vault reference with the control, on the image it acts on', () => {
    const view = open(node(vaultAttrs))
    expect(view.dom.tagName).toBe('SPAN')
    expect(view.dom.className).toBe('folio-image')
    const img = view.dom.querySelector('img')
    expect(img?.getAttribute('src')).toBe('assets/photo.png')
    expect(img?.getAttribute('alt')).toBe('photo')
    const control = view.dom.querySelector('button')
    expect(control?.getAttribute('aria-label')).toBe('Expand image')
    expect(control?.getAttribute('aria-expanded')).toBe('false')
    expect(view.dom.hasAttribute('data-expanded')).toBe(false)
  })

  it('leaves a remote reference as a bare image with no control', () => {
    const view = open(node({ src: 'https://example.test/photo.png', alt: 'photo', title: '' }))
    expect(view.dom.tagName).toBe('IMG')
    expect(view.dom.getAttribute('src')).toBe('https://example.test/photo.png')
    expect(view.dom.querySelector('button')).toBeNull()
  })

  it('toggles the expanded state and names the action both ways', () => {
    const view = open(node(vaultAttrs))
    const control = view.dom.querySelector('button')
    control?.click()
    expect(view.dom.hasAttribute('data-expanded')).toBe(true)
    expect(control?.getAttribute('aria-label')).toBe('Collapse image')
    expect(control?.getAttribute('aria-expanded')).toBe('true')
    control?.click()
    expect(view.dom.hasAttribute('data-expanded')).toBe(false)
    expect(control?.getAttribute('aria-label')).toBe('Expand image')
    expect(control?.getAttribute('aria-expanded')).toBe('false')
  })

  it('keeps the resolved URL the asset pass wrote when nothing changed', () => {
    const view = open(node(vaultAttrs))
    const img = view.dom.querySelector('img')
    // What the pane's resolution pass writes into the attribute.
    img?.setAttribute('src', 'blob:http://localhost/resolved')
    expect(view.update(node(vaultAttrs))).toBe(true)
    expect(img?.getAttribute('src')).toBe('blob:http://localhost/resolved')
  })

  it('writes a reference that really changed', () => {
    const view = open(node(vaultAttrs))
    const img = view.dom.querySelector('img')
    const changed = { src: 'assets/other.png', alt: 'other', title: 't' }
    expect(view.update(node(changed))).toBe(true)
    expect(img?.getAttribute('src')).toBe('assets/other.png')
    expect(img?.getAttribute('alt')).toBe('other')
    expect(img?.getAttribute('title')).toBe('t')
  })

  it('asks for a rebuild when a reference crosses between vault and remote', () => {
    const vault = open(node(vaultAttrs))
    expect(vault.update(node({ ...vaultAttrs, src: 'https://example.test/photo.png' }))).toBe(false)
    const remote = open(node({ src: 'https://example.test/photo.png', alt: '', title: '' }))
    expect(remote.update(node(vaultAttrs))).toBe(false)
  })

  it('asks for a rebuild for a node of another type', () => {
    const view = open(node(vaultAttrs))
    const paragraph = { type: { name: 'paragraph' }, attrs: {} } as unknown as ProseNode
    expect(view.update(paragraph)).toBe(false)
  })

  it('claims the control’s own events and leaves the image’s to the editor', () => {
    const view = open(node(vaultAttrs))
    const control = view.dom.querySelector('button')
    const img = view.dom.querySelector('img')
    const onControl = new MouseEvent('mousedown', { bubbles: true })
    control?.dispatchEvent(onControl)
    expect(view.stopEvent(onControl)).toBe(true)
    const onImage = new MouseEvent('mousedown', { bubbles: true })
    img?.dispatchEvent(onImage)
    expect(view.stopEvent(onImage)).toBe(false)
  })
})
