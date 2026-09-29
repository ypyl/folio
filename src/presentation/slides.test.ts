import { describe, expect, it } from 'vitest'
import type { StaticBlock } from '../editor/editor'
import { deriveSlides } from './slides'

const p = (text: string): StaticBlock => ({ type: 'paragraph', html: `<p>${text}</p>` })
const hr: StaticBlock = { type: 'hr', html: '<hr>' }
const code = (body: string): StaticBlock => ({
  type: 'code_block',
  html: `<pre><code>${body}</code></pre>`,
})

describe('deriveSlides (add-presentations)', () => {
  it('splits on top-level thematic breaks', () => {
    expect(deriveSlides([p('Intro'), hr, p('Talk'), hr, p('End')])).toEqual([
      '<p>Intro</p>',
      '<p>Talk</p>',
      '<p>End</p>',
    ])
  })

  it('is one slide with no break', () => {
    expect(deriveSlides([p('A'), p('B')])).toEqual(['<p>A</p><p>B</p>'])
  })

  it('drops a leading break, producing no empty slide', () => {
    expect(deriveSlides([hr, p('A')])).toEqual(['<p>A</p>'])
  })

  it('drops a trailing break', () => {
    expect(deriveSlides([p('A'), hr])).toEqual(['<p>A</p>'])
  })

  it('collapses consecutive breaks', () => {
    expect(deriveSlides([p('A'), hr, hr, p('B')])).toEqual(['<p>A</p>', '<p>B</p>'])
  })

  it('keeps a --- inside a code block as content', () => {
    expect(deriveSlides([code('a\n---\nb')])).toEqual(['<pre><code>a\n---\nb</code></pre>'])
  })

  it('does not treat a nested break as a boundary', () => {
    // A break inside another block serializes into that block's HTML, so it is
    // never a top-level `hr` and never starts a slide.
    const quote: StaticBlock = {
      type: 'blockquote',
      html: '<blockquote><p>A</p><hr><p>B</p></blockquote>',
    }
    expect(deriveSlides([p('Intro'), quote])).toEqual([
      '<p>Intro</p><blockquote><p>A</p><hr><p>B</p></blockquote>',
    ])
  })

  it('keeps an empty page as one empty slide', () => {
    expect(deriveSlides([{ type: 'paragraph', html: '<p></p>' }])).toEqual(['<p></p>'])
  })

  it('yields one empty slide when the page is only breaks', () => {
    expect(deriveSlides([hr, hr])).toEqual([''])
  })
})
