// The image node's DOM is Folio's (fit-vault-images-to-pane, design D2, ADR-0018).
//
// A vault image should read at the pane's width and be viewable at its own size
// on demand, which needs a control sitting *on* the image — a real element
// inside the editable surface. ProseMirror owns that surface: DOM injected into
// it from outside is read back as content and re-parsed, so the control has to
// arrive through the sanctioned door. This node view is it. It renders the
// element and toggles one attribute on itself; it knows nothing about the
// vault, resolution, or React — the pane's own pass (assetImages) still resolves
// the `src` into a `blob:` URL, and this view is careful never to write that
// attribute back to the markdown path (design D6).
//
// A reference that is not a vault path keeps a bare `<img>`, exactly as the
// schema rendered it before: no wrapper, no fit, no control (design D3). The
// same goes for the *shape* of the view, which is why `update` reports a
// reference that crossed between the two as a rebuild rather than an update.

import { imageSchema } from '@milkdown/preset-commonmark'
import type { Node as ProseNode } from '@milkdown/prose/model'
import type { NodeView, NodeViewConstructor } from '@milkdown/prose/view'
import { $view } from '@milkdown/utils'
import { isVaultRelative } from '../vault/assetOpen'

/** The wrapper and control classes the pane's stylesheet targets. Global names,
 *  like the badge and struck-run classes the decorations write. */
const WRAPPER_CLASS = 'folio-image'
const CONTROL_CLASS = 'folio-image-control'

/** The wrapper's state attribute: the image is shown at its own size, not
 *  fitted to the pane. */
const EXPANDED_ATTR = 'data-expanded'

/** The control's accessible name and tooltip, by state: it names the action it
 *  performs, not the state it is in (spec: "The control names the action"). */
const EXPAND_LABEL = 'Expand image'
const COLLAPSE_LABEL = 'Collapse image'

/** Two-state glyph, one path each, on a 24-unit viewBox: arrows out to expand,
 *  arrows in to collapse. Drawn here rather than in a stylesheet because the
 *  control is built in this module and has no React component. */
const GLYPH_EXPAND = 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7'
const GLYPH_COLLAPSE = 'M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7'
const SVG_NS = 'http://www.w3.org/2000/svg'

/** The attribute values the last render wrote, so a reconciliation that changed
 *  nothing leaves the element alone — including the `blob:` URL the pane's
 *  resolution pass put in `src`, which must survive every keystroke (D6). */
type Bound = { src: string; alt: string; title: string }

/** A node attribute as text; a missing one renders as the empty string, which
 *  is what the schema's own `toDOM` produced. */
function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** Write the node's attributes onto `img`, skipping anything unchanged. Only a
 *  `src` that really differs is written back, so resolution is never undone. */
function bind(node: ProseNode, img: HTMLImageElement, bound: Bound): void {
  const src = text(node.attrs.src)
  const alt = text(node.attrs.alt)
  const title = text(node.attrs.title)
  if (src !== bound.src) {
    bound.src = src
    img.src = src
  }
  if (alt !== bound.alt) {
    bound.alt = alt
    img.alt = alt
  }
  if (title !== bound.title) {
    bound.title = title
    img.title = title
  }
}

/** The expand/collapse glyph: one SVG whose path is swapped by state. */
function glyph(): { svg: SVGSVGElement; path: SVGPathElement } {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', GLYPH_EXPAND)
  svg.append(path)
  return { svg, path }
}

/** The image node's view (design D2 to D4): a bare image, or — for a reference
 *  into the vault — a wrapper holding the image and its expand/collapse
 *  control. The expanded state is one attribute on the wrapper; the stylesheet
 *  turns it into the image's own width, so no pixel value is computed, stored,
 *  or written anywhere. Exported on its own so it can be exercised without a
 *  running editor. */
export const vaultImageNodeView =
  (): NodeViewConstructor =>
  (node): NodeView => {
    const img = document.createElement('img')
    const bound: Bound = { src: '', alt: '', title: '' }
    bind(node, img, bound)

    // Reconcile against the updated node and report whether this element can
    // keep rendering it: the same type, and a reference still on this side of
    // the vault/remote line. A `src` that crossed the line is a different view
    // — with or without the wrapper — so ProseMirror is asked to rebuild it.
    const updateWith = (updated: ProseNode, vaultShape: boolean): boolean => {
      if (updated.type !== node.type) return false
      bind(updated, img, bound)
      return vaultShape === isVaultRelative(bound.src)
    }

    if (!isVaultRelative(bound.src)) {
      return { dom: img, update: (updated: ProseNode) => updateWith(updated, false) }
    }

    const { svg, path } = glyph()
    const control = document.createElement('button')
    control.type = 'button'
    control.className = CONTROL_CLASS
    // Not editable text, and never a press the editor should read as a
    // document interaction: `stopEvent` below reports it as the control's own.
    control.contentEditable = 'false'
    control.append(svg)
    const wrapper = document.createElement('span')
    wrapper.className = WRAPPER_CLASS
    wrapper.append(img, control)

    let expanded = false
    const setExpanded = (next: boolean): void => {
      expanded = next
      if (next) wrapper.setAttribute(EXPANDED_ATTR, '')
      else wrapper.removeAttribute(EXPANDED_ATTR)
      control.setAttribute('aria-expanded', String(next))
      control.setAttribute('aria-label', next ? COLLAPSE_LABEL : EXPAND_LABEL)
      control.title = next ? COLLAPSE_LABEL : EXPAND_LABEL
      path.setAttribute('d', next ? GLYPH_COLLAPSE : GLYPH_EXPAND)
    }
    setExpanded(false)
    control.addEventListener('click', () => setExpanded(!expanded))
    // A press that only changes how the image is shown must not take the
    // caret out of the document: preventing the default keeps focus (and the
    // selection) where the user left it. Keyboard activation still works.
    control.addEventListener('mousedown', (event) => event.preventDefault())

    return {
      dom: wrapper,
      update: (updated: ProseNode) => updateWith(updated, true),
      stopEvent: (event: Event): boolean =>
        event.target instanceof Node && control.contains(event.target),
    }
  }

/** The plugin the adapter registers over the commonmark image node. */
export const vaultImageView = $view(imageSchema.node, vaultImageNodeView)
