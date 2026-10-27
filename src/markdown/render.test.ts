import { describe, expect, it } from 'vitest'
import { blockType, renderBlock, renderInline } from './render'

describe('renderInline', () => {
  it('renders emphasis, strong, strikethrough, and code spans', () => {
    expect(renderInline('a *b* **c** ~~d~~ `e`')).toBe(
      'a <em>b</em> <strong>c</strong> <del>d</del> <code>e</code>',
    )
  })

  it('renders links in a new tab, with the editor table attrs', () => {
    expect(renderInline('[Docs](https://example.com)')).toBe(
      '<a href="https://example.com" data-href="https://example.com" target="_blank" rel="noopener noreferrer">Docs</a>',
    )
    expect(renderInline('<https://example.com>')).toContain('target="_blank"')
  })

  it('renders a vault image for the presentation pass to resolve', () => {
    expect(renderInline('![A chart](assets/chart.svg)')).toBe(
      '<img src="assets/chart.svg" alt="A chart" loading="lazy">',
    )
  })

  it('renders reference chips and leaves one inside a code span literal', () => {
    expect(renderInline('see #Inbox and `#Inbox`')).toBe(
      'see <span class="ref" data-ref-target="Inbox" data-ref-kind="page">#Inbox</span> and <code>#Inbox</code>',
    )
    expect(renderInline('see #![[How Folio works]]')).toContain('data-ref-kind="board"')
  })

  it('escapes raw HTML instead of executing it', () => {
    expect(renderInline('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
  })
})

describe('blockType', () => {
  it('names the block constructs the deck renders', () => {
    expect(blockType('# Title')).toBe('heading')
    expect(blockType('- item')).toBe('bullet_list')
    expect(blockType('1. item')).toBe('ordered_list')
    expect(blockType('> quote')).toBe('blockquote')
    expect(blockType('| a | b |')).toBe('table')
    expect(blockType('```js\nx\n```')).toBe('code_block')
    expect(blockType('~~~\nx\n~~~')).toBe('code_block')
    expect(blockType('---')).toBe('hr')
    expect(blockType('plain')).toBe('paragraph')
  })
})

describe('renderBlock', () => {
  it('renders headings and paragraphs with inline markup', () => {
    expect(renderBlock('## A **title**')).toBe('<h2>A <strong>title</strong></h2>')
    expect(renderBlock('soft\nbreak')).toBe('<p>soft break</p>')
    expect(renderBlock('hard  \nbreak')).toBe('<p>hard<br>break</p>')
  })

  it('renders nested and ordered lists', () => {
    expect(renderBlock('- one\n  - child\n- two')).toBe(
      '<ul><li>one<ul><li>child</li></ul></li><li>two</li></ul>',
    )
    expect(renderBlock('1. first\n2. second')).toBe('<ol><li>first</li><li>second</li></ol>')
  })

  it('renders a blockquote with its inner blocks', () => {
    expect(renderBlock('> quote\n>\n> - item')).toBe(
      '<blockquote><p>quote</p><ul><li>item</li></ul></blockquote>',
    )
  })

  it('renders a fenced block with its language and escaped code', () => {
    expect(renderBlock('```js\nif (a < b) {}\n```')).toBe(
      '<pre><code class="language-js">if (a &lt; b) {}</code></pre>',
    )
    expect(renderBlock('~~~\n---\n~~~')).toContain('<code>---</code>')
  })

  it('renders a GFM table with alignment and inline cells', () => {
    const html = renderBlock('| Name | Count |\n| :--- | ---: |\n| **a** | `1` |')
    expect(html).toContain('<thead><tr><th style="text-align:left">Name</th>')
    expect(html).toContain('<th style="text-align:right">Count</th>')
    expect(html).toContain('<td style="text-align:left"><strong>a</strong></td>')
    expect(html).toContain('<td style="text-align:right"><code>1</code></td>')
  })

  it('escapes raw HTML in a paragraph and a table cell', () => {
    expect(renderBlock('<script>x</script>')).toBe('<p>&lt;script&gt;x&lt;/script&gt;</p>')
    expect(renderBlock('| <b>x</b> |\n| --- |')).toContain('&lt;b&gt;x&lt;/b&gt;')
  })
})
