// The CodeMirror adapter's smoke test (swap-editor-to-codemirror-live-preview).
// It runs against jsdom, which has no layout: CodeMirror falls back to rendering
// the whole document, which is exactly what these tests need. A press whose
// position is resolved is supplied by hand (see `pressAt`); the vault image
// pass's viewport observer is exercised in the pane's own test.

import { CompletionContext, completionStatus, currentCompletions } from '@codemirror/autocomplete'
import { languages } from '@codemirror/language-data'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createAssetImages, releaseAssetImages, syncAssetImages } from './assetImages'
import { CodeMirrorAdapter, completionSource } from './codemirror'
import type { SuggestionSources } from './editor'

// jsdom has no layout, so it has no text rects. CodeMirror's own press handling
// scans them (which is what a press the adapter does not claim falls through
// to), so the two methods it needs answer with nothing rather than throwing.
beforeAll(() => {
  Range.prototype.getClientRects = () =>
    ({
      length: 0,
      item: () => null,
      [Symbol.iterator]: () => [][Symbol.iterator](),
    }) as unknown as DOMRectList
  Range.prototype.getBoundingClientRect = () => new DOMRect()
})

let adapter: CodeMirrorAdapter | null = null
let host: HTMLElement | null = null

async function open(markdown: string, sources?: SuggestionSources): Promise<HTMLElement> {
  host = document.createElement('div')
  document.body.append(host)
  adapter = new CodeMirrorAdapter()
  // Attach before mount: the source reads the object the adapter mounts with.
  if (sources) adapter.setSuggestionSource(sources)
  await adapter.mount(host)
  await adapter.setContent(markdown)
  return host
}

afterEach(async () => {
  await adapter?.destroy()
  adapter = null
  host?.remove()
  host = null
})

describe('the document is the text', () => {
  it('shows the page markdown as the document', async () => {
    const el = await open('# Title\n\nSome prose.')
    expect(el.textContent).toContain('# Title')
    expect(el.textContent).toContain('Some prose.')
  })

  it('keeps the markers in the text it edits, even when it hides them', async () => {
    await open('# Title\n\nSome *prose*.\n')
    const changes: string[] = []
    adapter?.onChange((markdown) => changes.push(markdown))
    adapter?.insertMarkdown('x')
    // The rendered text drops the emphasis markers; the document does not.
    expect(changes[0]).toContain('Some *prose*.')
  })

  it('reports an edit as the document text, not a serialization', async () => {
    const el = await open('hello')
    const changes: string[] = []
    adapter?.onChange((markdown) => changes.push(markdown))
    // The seed leaves the caret at the document start.
    adapter?.insertMarkdown('world ')
    expect(changes).toEqual(['world hello'])
    expect(el.querySelector('.cm-content')?.textContent).toBe('world hello')
  })

  it('does not report the seeded content as an edit', async () => {
    await open('seeded')
    const changes: string[] = []
    adapter?.onChange((markdown) => changes.push(markdown))
    await adapter?.setContent('seeded')
    expect(changes).toEqual([])
  })
})

describe('inline rendering is view-only', () => {
  it('renders a vault image reference in place of its source', async () => {
    const el = await open('before\n\n![photo](assets/photo.png)\n')
    expect(el.querySelector('.folio-image img')?.getAttribute('src')).toBe('assets/photo.png')
    expect(el.textContent).not.toContain('assets/photo.png')
  })
  it('keeps the reference in the text while showing the image', async () => {
    const el = await open('lead\n\n![photo](assets/photo.png)')
    // Scoped to the wrapper: CodeMirror puts its own `<img class="cm-widgetBuffer">`
    // in the line for cursor placement.
    expect(el.querySelector('.folio-image img')).not.toBeNull()
    const changes: string[] = []
    adapter?.onChange((markdown) => changes.push(markdown))
    adapter?.insertMarkdown('!')
    expect(changes[0]).toContain('![photo](assets/photo.png)')
  })

  it('resolves a vault image through the pane\u2019s own pass', async () => {
    // The pane's pass walks `img` elements and knows nothing about the editor,
    // so a widget that renders the reference as a plain `img` inside the
    // `.folio-image` wrapper is resolved, marked resolved, and released with no
    // change to src/editor/assetImages.ts (ADR-0028).
    const el = await open('lead\n\n![photo](assets/photo.png)\n')
    const img = el.querySelector('.folio-image img') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('assets/photo.png')

    const cache = createAssetImages()
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:folio/photo')
    syncAssetImages(el, cache, () => Promise.resolve(new Blob(['png'])))
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(create).toHaveBeenCalled()
    expect(img.getAttribute('src')).toBe('blob:folio/photo')
    expect(el.querySelector('.folio-image')?.hasAttribute('data-resolved')).toBe(true)

    releaseAssetImages(cache)
    create.mockRestore()
  })

  it('renders an angle-bracketed destination holding a space', async () => {
    const el = await open('lead\n\n![photo](<my photo.png>)\n')
    expect(el.querySelector('.folio-image img')?.getAttribute('src')).toBe('my photo.png')
  })

  it('chips a page reference over its literal text', async () => {
    const el = await open('see #Inbox and #[[reading list]]')
    expect(el.querySelectorAll('.ref').length).toBe(2)
    expect(el.textContent).toContain('#Inbox')
    expect(el.textContent).toContain('#[[reading list]]')
  })

  it('does not chip a plain wikilink', async () => {
    const el = await open('see [[Inbox]]')
    expect(el.querySelectorAll('.ref').length).toBe(0)
  })

  it('does not chip a reference inside a fence', async () => {
    const el = await open('```\n#Inbox\n```\n')
    expect(el.querySelectorAll('.ref').length).toBe(0)
  })
})

describe('a GFM table renders as a table', () => {
  const doc =
    'lead\n\n| Name | Count |\n| :--- | ---: |\n| **a** | `1` |\n| #Inbox | [x](https://example.com) |\n'

  it('renders the header and body cells without the pipes', async () => {
    const el = await open(doc)
    const table = el.querySelector('table')
    expect(table).not.toBeNull()
    expect([...table!.querySelectorAll('th')].map((cell) => cell.textContent)).toEqual([
      'Name',
      'Count',
    ])
    expect([...table!.querySelectorAll('tbody tr')].length).toBe(2)
    expect(table!.querySelectorAll('td')[0].textContent).toBe('a')
    expect(el.textContent).not.toContain(':---')
  })

  it('applies the delimiter row alignment', async () => {
    const el = await open(doc)
    const cells = el.querySelectorAll('td')
    expect(cells[1].style.textAlign).toBe('right')
  })

  it('renders a cell\u2019s inline markup and chips its references', async () => {
    const el = await open(doc)
    expect(el.querySelector('td strong')?.textContent).toBe('a')
    expect(el.querySelector('td code')?.textContent).toBe('1')
    const chip = el.querySelector('td .ref[data-ref-target]')
    expect(chip?.getAttribute('data-ref-target')).toBe('Inbox')
    expect(el.querySelector('td a[data-href]')?.getAttribute('data-href')).toBe(
      'https://example.com',
    )
  })

  it('shows the source while the caret is on the table', async () => {
    const el = await open('| a | b |\n| --- | --- |\n| 1 | 2 |\n')
    expect(el.querySelector('table')).toBeNull()
    expect(el.textContent).toContain('| a | b |')
  })

  it('keeps the pipe table as the document text', async () => {
    await open(doc)
    const changes: string[] = []
    adapter?.onChange((markdown) => changes.push(markdown))
    adapter?.insertMarkdown('x')
    expect(changes[0]).toContain('| :--- | ---: |')
  })
})

describe('the pane reads', () => {
  it('splits the document into blocks for a presentation', async () => {
    await open('# Title\n\ntext\n\n```js\ncode\n```')
    const blocks = adapter?.staticBlocks() ?? []
    expect(blocks.map((block) => block.type)).toEqual(['heading', 'paragraph', 'code_block'])
  })

  it('marks a located block without touching the text', async () => {
    // The mark's own behaviour lives in "the located block is framed" below;
    // this keeps the seam's two calls honest: a block marks, a null clears.
    const el = await open('# One\n\ntwo\n\nthree')
    adapter?.highlightBlocks([1])
    expect(el.querySelectorAll('.folio-search-hit').length).toBe(1)
    adapter?.highlightBlocks([])
    expect(el.querySelectorAll('.folio-search-hit').length).toBe(0)
  })
})

describe('inline formatting renders at rest', () => {
  it('hides bold, italic, strike, and code markers away from the caret', async () => {
    const el = await open('lead **bold** then *italic* then ~~struck~~ then `code` end\n')
    expect(el.textContent).toContain('bold')
    expect(el.textContent).toContain('italic')
    expect(el.textContent).toContain('struck')
    expect(el.textContent).toContain('code')
    expect(el.textContent).not.toContain('**')
    expect(el.textContent).not.toContain('~~')
    expect(el.textContent).not.toContain('`')
  })

  it('keeps the content styled by the document grammar', async () => {
    const el = await open('lead **bold** then *italic* then ~~struck~~ end\n')
    // A highlighted run carries a class from the theme's HighlightStyle, so the
    // formatted text keeps its weight, slant, and struck line after the markers
    // are removed. Assert that the run is styled, not what the class is named.
    const runs = [...el.querySelectorAll('.cm-content span')]
    expect(runs.some((span) => span.textContent === 'bold' && span.className !== '')).toBe(true)
    expect(runs.some((span) => span.textContent === 'italic' && span.className !== '')).toBe(true)
    expect(runs.some((span) => span.textContent === 'struck' && span.className !== '')).toBe(true)
  })

  it('shows the symbols while the caret is inside the span', async () => {
    const el = await open('**bold** tail\n')
    // The seed leaves the caret at the document start, which touches the span.
    expect(el.textContent).toContain('**bold**')
  })

  it('hides every marker of a nested run', async () => {
    const el = await open('lead **bold *nested* bold** end\n')
    expect(el.textContent).toContain('bold nested bold')
    expect(el.textContent).not.toContain('*')
  })

  it('leaves a fenced block alone', async () => {
    const el = await open('lead\n\n```\n**not bold** and `not code`\n```\n')
    expect(el.textContent).toContain('**not bold**')
    expect(el.textContent).toContain('`not code`')
  })
})

describe('what an edit and a copy carry', () => {
  it('copies the Markdown source, not the rendered text', async () => {
    const el = await open('lead **bold** end\n')
    // At rest the run hides its markers in the DOM.
    expect(el.textContent).not.toContain('**')
    const view = (adapter as unknown as { view: EditorView }).view
    view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } })
    view.focus()
    const written: Record<string, string> = {}
    const event = new Event('copy', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', {
      value: {
        setData: (type: string, value: string) => {
          written[type] = value
        },
        getData: (type: string) => written[type] ?? '',
        clearData: () => {},
      },
    })
    view.contentDOM.dispatchEvent(event)
    // Selecting the run reveals its markers, and the clipboard still carries
    // the page's Markdown, because CodeMirror copies from the document.
    expect(written['text/plain']).toBe('lead **bold** end\n')
    expect(el.textContent).toContain('**bold**')
  })
})

describe('opening a link needs the platform modifier', () => {
  /** jsdom has no layout, so the position a press lands on is supplied by hand:
   *  the hit test is CodeMirror's, and this test is about what happens once a
   *  destination is found. */
  function pressAt(el: HTMLElement, offset: number, modifiers: MouseEventInit = {}): MouseEvent {
    const view = (adapter as unknown as { view: EditorView }).view
    ;(view as unknown as { posAtCoords: () => number }).posAtCoords = () => offset
    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      ...modifiers,
    })
    el.querySelector('.cm-content')?.dispatchEvent(event)
    return event
  }

  it('opens a markdown link only on Ctrl or Cmd', async () => {
    const el = await open('see [Example](https://example.com) end\n')
    const opened = vi.fn()
    vi.stubGlobal('open', opened)
    try {
      pressAt(el, 6)
      expect(opened).not.toHaveBeenCalled()
      pressAt(el, 6, { ctrlKey: true })
      // The vault layer's opener normalises through `new URL`, so an empty path
      // arrives with its slash.
      expect(opened).toHaveBeenCalledWith('https://example.com/', '_blank', 'noopener,noreferrer')
      opened.mockClear()
      pressAt(el, 6, { metaKey: true })
      expect(opened).toHaveBeenCalledTimes(1)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('opens a www URL as https', async () => {
    const el = await open('see www.example.com end\n')
    const opened = vi.fn()
    vi.stubGlobal('open', opened)
    try {
      pressAt(el, 6, { ctrlKey: true })
      expect(opened).toHaveBeenCalledWith(
        'https://www.example.com/',
        '_blank',
        'noopener,noreferrer',
      )
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('opens nothing for an absolute path', async () => {
    const el = await open('see [etc](/etc/passwd) end\n')
    const opened = vi.fn()
    vi.stubGlobal('open', opened)
    try {
      pressAt(el, 6, { ctrlKey: true })
      expect(opened).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('opens a bare URL only on Ctrl or Cmd', async () => {
    const el = await open('see https://example.com/x end\n')
    const opened = vi.fn()
    vi.stubGlobal('open', opened)
    try {
      pressAt(el, 6)
      expect(opened).not.toHaveBeenCalled()
      pressAt(el, 6, { ctrlKey: true })
      expect(opened).toHaveBeenCalledWith('https://example.com/x', '_blank', 'noopener,noreferrer')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('opens a reference on a plain press', async () => {
    const el = await open('lead #Inbox end\n')
    const clicked = vi.fn()
    adapter?.onReferenceClick(clicked)
    pressAt(el, 6)
    expect(clicked).toHaveBeenCalledWith('Inbox', 'page')
  })

  it('opens nothing for a bare fragment, with or without the modifier', async () => {
    const el = await open('see [#section](#section) end\n')
    const opened = vi.fn()
    vi.stubGlobal('open', opened)
    try {
      pressAt(el, 6, { ctrlKey: true })
      expect(opened).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('Mod+Enter opens the reference at the caret', () => {
  function pressModEnter(el: HTMLElement): void {
    el.querySelector('.cm-content')?.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      }),
    )
  }

  it('opens the reference the caret sits in', async () => {
    const el = await open('lead #Inbox end\n')
    const view = (adapter as unknown as { view: EditorView }).view
    view.dispatch({ selection: { anchor: 8 } })
    const clicked = vi.fn()
    adapter?.onReferenceClick(clicked)
    pressModEnter(el)
    expect(clicked).toHaveBeenCalledWith('Inbox', 'page')
  })

  it('leaves the chord alone when the caret is not in a reference', async () => {
    const el = await open('lead #Inbox end\n')
    const view = (adapter as unknown as { view: EditorView }).view
    view.dispatch({ selection: { anchor: 0 } })
    const clicked = vi.fn()
    adapter?.onReferenceClick(clicked)
    pressModEnter(el)
    expect(clicked).not.toHaveBeenCalled()
  })
})

describe('a bare URL reads as a link', () => {
  it('marks the bare URL, not the destination inside a link', async () => {
    const el = await open('see https://example.com/x and [t](https://other.example) end\n')
    const marked = [...el.querySelectorAll('.folio-cm-url')].map((node) => node.textContent)
    expect(marked).toEqual(['https://example.com/x'])
  })

  it('leaves a URL inside a code span alone', async () => {
    const el = await open('see `https://example.com` end\n')
    expect(el.querySelectorAll('.folio-cm-url').length).toBe(0)
  })
})

describe('accepting a file candidate writes a destination Markdown reads', () => {
  function accept(doc: string, path: string) {
    const state = EditorState.create({ doc })
    const result = completionSource({
      pages: () => [],
      files: () => [{ name: path.split('/').pop() ?? path, path, match: [0, 1] }],
    })(new CompletionContext(state, state.doc.length, false))
    return result?.options[0].apply
  }

  it('escapes the characters that would end the destination', () => {
    // micromark ends a destination at the space, so the escaping is what makes
    // the written text a link at all.
    expect(accept('[Q3 report](assets/Q3', 'assets/Q3 report.pdf')).toBe('assets/Q3%20report.pdf')
    expect(accept('[a](assets/a', 'assets/a(1).png')).toBe('assets/a%281%29.png')
    expect(accept('[a](assets/100', 'assets/100% done.pdf')).toBe('assets/100%25%20done.pdf')
  })

  it('leaves a path that needs no escaping alone', () => {
    expect(accept('[a](assets/a', 'assets/a.png')).toBe('assets/a.png')
    expect(accept('[a](nested/dir/b', 'nested/dir/b.pdf')).toBe('nested/dir/b.pdf')
  })

  it('replaces only the typed destination', () => {
    const doc = '[Q3 report](assets/Q3'
    const state = EditorState.create({ doc })
    const result = completionSource({
      pages: () => [],
      files: () => [{ name: 'x', path: 'assets/Q3 report.pdf', match: [0, 1] }],
    })(new CompletionContext(state, state.doc.length, false))
    expect(result?.from).toBe(doc.length - 'assets/Q3'.length)
    expect(result?.to).toBe(doc.length)
  })
})

describe('typing a reference opens the popup', () => {
  const pages: SuggestionSources = {
    pages: () => [
      { name: 'Reading list', path: 'Reading list.md', match: [0, 3] },
      { name: 'Reading', path: 'Reading.md', match: [0, 3] },
    ],
    files: () => [],
  }

  const view = (): EditorView => (adapter as unknown as { view: EditorView }).view

  /** Type `text` at the caret as a real input event: only `input.type`
   *  activates the completion source on typing. */
  function type(text: string): void {
    const v = view()
    const at = v.state.selection.main.head
    v.dispatch({
      changes: { from: at, insert: text },
      selection: { anchor: at + text.length },
      userEvent: 'input.type',
    })
  }

  const place = (pos: number): void => view().dispatch({ selection: { anchor: pos } })

  // The source runs after the typing debounce and resolves in a microtask, so a
  // popup is only on screen a measure later.
  const popupOpen = async (): Promise<void> => {
    await vi.waitFor(() => expect(completionStatus(view().state)).toBe('active'))
  }

  async function expectNoPopup(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(completionStatus(view().state)).toBeNull()
    expect(currentCompletions(view().state)).toEqual([])
  }

  it('lists the app-ordered rows whose labels never match the typed sigil', async () => {
    await open('', pages)
    type('#rea')
    // CodeMirror's default filter would match `#rea` against the labels and
    // drop every row; `filter: false` keeps the pool's order.
    await popupOpen()
    expect(currentCompletions(view().state).map((row) => row.label)).toEqual([
      'Reading list',
      'Reading',
    ])
  })

  it('accepts the first row on Enter, through the editor keymap', async () => {
    const el = await open('', {
      pages: () => [{ name: 'Reading', path: 'Reading.md', match: [0, 3] }],
      files: () => [],
    })
    type('#rea')
    await popupOpen()
    // The popup ignores keys for `interactionDelay` after it opens.
    await new Promise((resolve) => setTimeout(resolve, 120))
    el.querySelector('.cm-content')?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    )
    expect(view().state.doc.toString()).toBe('#Reading')
  })

  it('offers nothing inside a fenced code block', async () => {
    await open('```\n#re\n```', pages)
    place(7)
    type('a')
    await expectNoPopup()
  })

  it('offers nothing at the end of a fenced block, where the caret usually is', async () => {
    // A right-biased syntax lookup resolves the document end to the Document,
    // missing the fence the user is typing into.
    await open('```\n#re', pages)
    place(7)
    type('a')
    await expectNoPopup()
  })

  it('offers nothing inside inline code', async () => {
    await open('`#re`', pages)
    place(4)
    type('a')
    await expectNoPopup()
  })

  it('still offers pages outside code', async () => {
    await open('note #re', pages)
    place(8)
    type('a')
    await popupOpen()
    expect(currentCompletions(view().state)).toHaveLength(2)
  })

  it('still offers boards outside code', async () => {
    await open('', {
      pages: () => [],
      boards: () => [{ name: 'Migration', path: 'boards/Migration.excalidraw', match: [0, 3] }],
      files: () => [],
    })
    type('#!Mig')
    await popupOpen()
    expect(currentCompletions(view().state).map((row) => row.label)).toEqual(['Migration'])
  })

  it('still offers file destinations outside code', async () => {
    await open('', {
      pages: () => [],
      files: () => [{ name: 'assets/q3.png', path: 'assets/q3.png', match: [0, 7] }],
    })
    type('[x](assets/q')
    await popupOpen()
    expect(currentCompletions(view().state).map((row) => row.label)).toEqual(['assets/q3.png'])
  })

  it('returns filter: false so the app owns row filtering and order', () => {
    const state = EditorState.create({ doc: '#rea' })
    const result = completionSource({
      pages: () => [{ name: 'Reading', path: 'Reading.md', match: [0, 3] }],
      files: () => [],
    })(new CompletionContext(state, state.doc.length, false))
    expect(result?.filter).toBe(false)
  })
})

describe('a vault link opens through the vault layer', () => {
  it('decodes an escaped path before reading it', async () => {
    const el = await open('see [Q3 report](assets/Q3%20report.txt) end\n')
    const read = vi.fn(() => Promise.resolve(new Blob(['x'], { type: 'text/plain' })))
    adapter?.setAssetReader(read)
    // A fake window, so the display branch is taken and jsdom is not asked to
    // navigate (which it cannot do).
    const opened = vi.fn(() => ({ opener: null, location: { href: '' }, close() {} }))
    vi.stubGlobal('open', opened)
    try {
      const view = (adapter as unknown as { view: EditorView }).view
      ;(view as unknown as { posAtCoords: () => number }).posAtCoords = () => 6
      el.querySelector('.cm-content')?.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, ctrlKey: true }),
      )
      await Promise.resolve()
      // The path reaches the vault decoded: the escaping is a Markdown
      // destination's, not the file's name.
      expect(read).toHaveBeenCalledWith('assets/Q3 report.txt')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('sends a board path to the board view', async () => {
    const el = await open('see [board](boards/Plan.excalidraw) end\n')
    const onBoard = vi.fn()
    adapter?.onBoardLink(onBoard)
    const view = (adapter as unknown as { view: EditorView }).view
    ;(view as unknown as { posAtCoords: () => number }).posAtCoords = () => 6
    el.querySelector('.cm-content')?.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, ctrlKey: true }),
    )
    expect(onBoard).toHaveBeenCalledWith('boards/Plan.excalidraw')
  })
})

describe('a destination is not prose', () => {
  it('does not chip a fragment destination', async () => {
    const el = await open('jump [to a section](#section) here\n')
    expect(el.querySelectorAll('.ref').length).toBe(0)
  })

  it('does not chip a bare URL that carries a fragment', async () => {
    const el = await open('see https://example.com/page#tag end\n')
    expect(el.querySelectorAll('.ref').length).toBe(0)
  })

  it('still chips a reference beside a link destination', async () => {
    const el = await open('see #Inbox and [to a section](#section) here\n')
    expect([...el.querySelectorAll('.ref')].map((node) => node.textContent)).toEqual(['#Inbox'])
  })
})

describe('an escaped image destination renders through the whole chain', () => {
  it('writes the markdown path as the src and reads it decoded', async () => {
    // The parens are escaped, as `markdownDestination` writes them: a bare
    // destination cannot carry an unescaped `)`.
    const el = await open('lead\n\n![chart](assets/chart%202026%20%28final%29.png)\n')
    const img = el.querySelector('.folio-image img') as HTMLImageElement
    // The widget keeps the document's own characters, escaping and all.
    expect(img.getAttribute('src')).toBe('assets/chart%202026%20%28final%29.png')
    const read = vi.fn(() => Promise.resolve(new Blob(['png'], { type: 'image/png' })))
    const cache = createAssetImages()
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:folio/chart')
    syncAssetImages(el, cache, read)
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    // The pane's pass decodes it, so the file it names is the file it reads.
    expect(read).toHaveBeenCalledWith('assets/chart 2026 (final).png')
    expect(img.getAttribute('src')).toBe('blob:folio/chart')
    releaseAssetImages(cache)
    create.mockRestore()
  })
})

describe('a fenced block is highlighted in the language its info string names', () => {
  // The grammars come from the same catalog the app ships (@codemirror/
  // language-data), loaded lazily the first time a fence names one. Loading them
  // up front keeps this test about the colour mapping rather than about timing;
  // the lazy path has its own test below.
  const cases: [string, string, string][] = [
    ['json', '{"a": 1, "b": "s", "c": true}', '1'],
    ['python', 'def f(x):\n    return "s"  # c', 'def'],
    ['csharp', 'public class A { string F() { return "s"; } }', '"s"'],
    ['typescript', 'const a: string = "s"; // c', '// c'],
  ]

  beforeAll(async () => {
    await Promise.all(
      ['JSON', 'Python', 'C#', 'TypeScript'].map((name) =>
        languages.find((language) => language.name === name)?.load(),
      ),
    )
  })

  for (const [language, code, token] of cases) {
    it(`highlights ${language}`, async () => {
      const el = await open(`lead\n\n\`\`\`${language}\n${code}\n\`\`\`\n`)
      const content = el.querySelector('.cm-content') as HTMLElement
      // The token is coloured by the theme's style for its tag, and the fence
      // text is otherwise untouched.
      const styled = [...content.querySelectorAll('span')].filter((span) => span.className !== '')
      expect(styled.map((span) => span.textContent)).toContain(token)
      expect(content.textContent).toContain(code.split('\n')[0])
    })
  }

  it('colours a name, a class, and a comment as the mapping says', async () => {
    const el = await open('lead\n\n```typescript\nconst a: string = "s"; // c\n```\n')
    const classes = new Map(
      [...el.querySelectorAll('.cm-content span')]
        .filter((span) => span.className !== '')
        .map((span) => [span.textContent, span.className]),
    )
    // keyword, string, and comment each get their own style, so the three rules
    // are distinguishable rather than one rule colouring everything.
    expect(classes.get('const')).not.toBe(classes.get('"s"'))
    expect(classes.get('// c')).not.toBe(classes.get('"s"'))
  })

  it('highlights a fence whose grammar loads lazily, with no interaction', async () => {
    // The real path: opening a page loads the grammar on demand and the view
    // re-parses on its own, so a reader sees colour without touching anything.
    const el = await open('lead\n\n```sql\nselect 1 from t\n```\n')
    await new Promise((resolve) => setTimeout(resolve, 1200))
    const styled = [...el.querySelectorAll('.cm-content span')].filter(
      (span) => span.className !== '',
    )
    expect(styled.map((span) => span.textContent)).toContain('select')
  })

  it('leaves a language-less fence monochrome', async () => {
    const el = await open('lead\n\n```\nplain words\n```\n')
    const content = el.querySelector('.cm-content') as HTMLElement
    const styled = [...content.querySelectorAll('span')].filter((span) => span.className !== '')
    // The fence gets the block's own mark (and the code monospace), but no span
    // covers part of the line: a token-level span is what colouring looks like.
    const fragments = styled.filter(
      (span) => span.textContent !== 'plain words' && span.textContent !== '```',
    )
    expect(fragments).toEqual([])
    expect(styled.some((span) => span.className.includes('folio-cm-fence'))).toBe(true)
  })
})

describe('a markdown link reads as its text', () => {
  it('hides the brackets and the destination, and keeps the label', async () => {
    const el = await open('see [Example](https://example.com) end\n')
    expect(el.textContent).toBe('see Example end')
    expect(el.textContent).not.toContain('https://example.com')
  })

  it('keeps the whole construct in the document', async () => {
    await open('see [Example](https://example.com) end\n')
    const changes: string[] = []
    adapter?.onChange((markdown) => changes.push(markdown))
    adapter?.insertMarkdown('x')
    expect(changes[0]).toContain('[Example](https://example.com)')
  })

  it('shows the construct while the caret is inside it, and hides it again after', async () => {
    const el = await open('lead\n\nsee [Example](https://example.com) end\n')
    const view = (adapter as unknown as { view: EditorView }).view
    expect(el.textContent).not.toContain('https://example.com')
    // The caret at the link's first character counts as inside it.
    view.dispatch({ selection: { anchor: 11 } })
    expect(el.textContent).toContain('[Example](https://example.com)')
    view.dispatch({ selection: { anchor: 0 } })
    expect(el.textContent).toBe('leadsee Example end')
  })

  it('reads an autolink without its angle brackets', async () => {
    const el = await open('see <https://example.com> end\n')
    expect(el.textContent).toBe('see https://example.com end')
  })

  it('still opens the hidden destination on Ctrl+Click', async () => {
    const el = await open('see [Example](https://example.com) end\n')
    const opened = vi.fn()
    vi.stubGlobal('open', opened)
    try {
      const view = (adapter as unknown as { view: EditorView }).view
      ;(view as unknown as { posAtCoords: () => number }).posAtCoords = () => 7
      el.querySelector('.cm-content')?.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0, ctrlKey: true }),
      )
      expect(opened).toHaveBeenCalledWith('https://example.com/', '_blank', 'noopener,noreferrer')
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('keeps an empty link visible', async () => {
    const el = await open('lead\n\n[](https://example.com)\n')
    // Nothing to show if the marks were hidden, so the source stays.
    expect(el.textContent).toContain('[](https://example.com)')
  })

  it('leaves a link inside code literal', async () => {
    const el = await open(
      'lead `[x](https://example.com)` and\n\n```\n[y](https://example.com)\n```\n',
    )
    expect(el.textContent).toContain('[x](https://example.com)')
    expect(el.textContent).toContain('[y](https://example.com)')
  })

  it('still renders an image inside a link label', async () => {
    const el = await open('lead\n\n[![alt](assets/p.png)](https://example.com)\n')
    expect(el.querySelector('.folio-image img')?.getAttribute('src')).toBe('assets/p.png')
    expect(el.textContent).not.toContain('https://example.com')
  })

  it('renders a link inside a revealed table row', async () => {
    // The caret on the table shows its source, and the link inside it follows
    // the per-span rule, as a bold run there does: the pipes are text and the
    // link reads as its own text.
    const el = await open('| a |\n| --- |\n| [x](https://example.com) |\n')
    expect(el.textContent).toContain('| a |')
    expect(el.textContent).toContain('| x |')
    expect(el.textContent).not.toContain('https://example.com')
  })

  it('leaves Folio references and plain wikilinks literal', async () => {
    // Brackets alone parse as a shortcut reference link, so both of these would
    // lose their brackets without the destination rule.
    const el = await open('see #[[reading list]] and [[Page]] end\n')
    expect(el.textContent).toContain('#[[reading list]]')
    expect(el.textContent).toContain('[[Page]]')
  })
})

describe('the located block is framed', () => {
  const framed = (el: HTMLElement) => [...el.querySelectorAll('.folio-search-hit')]
  const has = (el: HTMLElement, cls: string) =>
    framed(el).some((line) => line.classList.contains(cls))

  it('frames every line of a multi-line block, and no neighbour', async () => {
    const el = await open('# Title\n\n- a\n- b\n- c\n\nTail\n')
    adapter?.highlightBlocks([1])
    // The list is one block over three lines; the heading and the tail are not.
    const lines = [...el.querySelectorAll('.cm-line')]
    expect(lines.map((line) => line.classList.contains('folio-search-hit'))).toEqual([
      false, // # Title
      false, // the blank line
      true, // - a
      true, // - b
      true, // - c
      false, // the blank line
      false, // Tail
      false, // the line after the trailing newline
    ])
    expect(lines[2].classList.contains('folio-search-hit-first')).toBe(true)
    expect(lines[3].classList.contains('folio-search-hit-first')).toBe(false)
    expect(lines[3].classList.contains('folio-search-hit-last')).toBe(false)
    expect(lines[4].classList.contains('folio-search-hit-last')).toBe(true)
  })

  it('gives a one-line block both edges', async () => {
    const el = await open('# Title\n\nBody\n')
    adapter?.highlightBlocks([1])
    expect(framed(el).length).toBe(1)
    expect(has(el, 'folio-search-hit-first')).toBe(true)
    expect(has(el, 'folio-search-hit-last')).toBe(true)
  })

  it('adds no character to the document', async () => {
    const el = await open('# Title\n\nBody\n')
    const changes: string[] = []
    adapter?.onChange((markdown) => changes.push(markdown))
    adapter?.highlightBlocks([1])
    expect(changes).toEqual([])
    expect(el.textContent).toBe('# TitleBody')
  })

  it('keeps the frame when the page is edited', async () => {
    const el = await open('# Title\n\nBody\n')
    adapter?.highlightBlocks([1])
    adapter?.insertMarkdown('x')
    // The old mark was cleared by the next document change; the frame is not.
    expect(framed(el).length).toBe(1)
  })

  it('is still framed long after the interval that used to clear it', async () => {
    vi.useFakeTimers()
    try {
      const el = await open('# Title\n\nBody\n')
      adapter?.highlightBlocks([1])
      vi.advanceTimersByTime(60_000)
      expect(framed(el).length).toBe(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('follows an edit that adds a line inside it', async () => {
    const el = await open('# Title\n\n- a\n- b\n')
    adapter?.highlightBlocks([1])
    expect(framed(el).length).toBe(2)
    const view = (adapter as unknown as { view: EditorView }).view
    // The caret at the end of the last item, then a new item: the block grows,
    // and the frame has to cover the line that did not exist when it was drawn.
    view.dispatch({ selection: { anchor: view.state.doc.length - 1 } })
    adapter?.insertMarkdown('\n- c')
    expect(framed(el).length).toBe(3)
    expect(has(el, 'folio-search-hit-last')).toBe(true)
  })

  it('replaces the frame on a later request and clears on a null one', async () => {
    const el = await open('# Title\n\nOne\n\nTwo\n')
    adapter?.highlightBlocks([1])
    expect(el.textContent).toBe('# TitleOneTwo')
    expect(framed(el).length).toBe(1)
    adapter?.highlightBlocks([2])
    expect(framed(el).length).toBe(1)
    expect(framed(el)[0].textContent).toBe('Two')
    adapter?.highlightBlocks([])
    expect(framed(el).length).toBe(0)
  })

  it('leaves the caret and the selection where they were', async () => {
    await open('# Title\n\nBody\n')
    const view = (adapter as unknown as { view: EditorView }).view
    view.dispatch({ selection: { anchor: 2 } })
    adapter?.highlightBlocks([1])
    expect(view.state.selection.main.anchor).toBe(2)
    expect(view.state.selection.main.head).toBe(2)
  })

  it('ignores an index the document does not hold', async () => {
    const el = await open('# Title\n\nBody\n')
    adapter?.highlightBlocks([9])
    expect(framed(el).length).toBe(0)
  })
})

describe('a located table is framed too', () => {
  const DOC = '# Title\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n\nTail\n'

  it('frames the table widget, because the table has no line to frame', async () => {
    const el = await open(DOC)
    // A table's lines are replaced by a block widget rendered beside the lines,
    // so the line frame has nothing to attach to.
    expect(el.querySelector('.folio-search-hit')).toBeNull()
    expect(el.querySelector('.folio-table-framed')).toBeNull()
    adapter?.highlightBlocks([1])
    expect(el.querySelector('.folio-table-framed')?.tagName).toBe('TABLE')
  })

  it('frames the table source instead while the caret is on it', async () => {
    const el = await open(DOC)
    adapter?.highlightBlocks([1])
    const view = (adapter as unknown as { view: EditorView }).view
    // The caret on the table shows its source, so the frame's line decorations
    // land on the lines the widget had replaced.
    view.dispatch({ selection: { anchor: 12 } })
    expect(el.querySelector('.folio-table-framed')).toBeNull()
    expect(el.querySelectorAll('.folio-search-hit').length).toBe(3)
  })

  it('unframes the table when the locate is cleared', async () => {
    const el = await open(DOC)
    adapter?.highlightBlocks([1])
    expect(el.querySelector('.folio-table-framed')).not.toBeNull()
    adapter?.highlightBlocks([])
    expect(el.querySelector('.folio-table-framed')).toBeNull()
  })

  it('keeps the table framed across an edit elsewhere', async () => {
    const el = await open(DOC)
    adapter?.highlightBlocks([1])
    const view = (adapter as unknown as { view: EditorView }).view
    view.dispatch({ selection: { anchor: view.state.doc.length } })
    adapter?.insertMarkdown('more\n')
    expect(el.querySelector('.folio-table-framed')).not.toBeNull()
  })

  it('does not frame the table next to the located block', async () => {
    const el = await open(DOC)
    // Block 2 is the paragraph after the table, not the table itself.
    adapter?.highlightBlocks([2])
    expect(el.querySelector('.folio-table-framed')).toBeNull()
    expect(el.querySelectorAll('.folio-search-hit').length).toBe(1)
  })
})

describe('every located block is framed', () => {
  const framed = (el: HTMLElement) => [...el.querySelectorAll('.folio-search-hit')]
  const framedLines = (el: HTMLElement) =>
    [...el.querySelectorAll('.cm-line')]
      .filter((line) => line.classList.contains('folio-search-hit'))
      .map((line) => line.textContent)

  it('frames each block it is given, and only those', async () => {
    const el = await open('# dog\n\nBody\n\nMore dog\n\nTail\n')
    // Blocks: the heading, the paragraph, the second paragraph, the tail.
    adapter?.highlightBlocks([0, 2])
    expect(framedLines(el)).toEqual(['# dog', 'More dog'])
  })

  it('scrolls to the first block it is given, not the last', async () => {
    await open('# dog\n\nBody\n\nMore dog\n\nTail\n')
    const view = (adapter as unknown as { view: EditorView }).view
    const dispatch = vi.spyOn(view, 'dispatch')
    adapter?.highlightBlocks([2, 0])
    // The second dispatch is the scroll, and it names the first block's line.
    const scroll = dispatch.mock.calls[1]?.[0] as {
      effects: { value: { range: { head: number } } }
    }
    const secondParagraph = view.state.doc.toString().indexOf('More dog')
    expect(scroll.effects.value.range.head).toBe(secondParagraph)
    dispatch.mockRestore()
  })

  it('keeps every frame across an edit, each with its own text', async () => {
    const el = await open('# dog\n\nBody\n\nMore dog\n\nTail\n')
    adapter?.highlightBlocks([0, 2])
    const view = (adapter as unknown as { view: EditorView }).view
    view.dispatch({ selection: { anchor: view.state.doc.length } })
    adapter?.insertMarkdown('added\n')
    expect(framedLines(el)).toEqual(['# dog', 'More dog'])
  })

  it('replaces every frame on a later request, and clears them all', async () => {
    const el = await open('# dog\n\nBody\n\nMore dog\n\nTail\n')
    adapter?.highlightBlocks([0, 2])
    expect(framed(el).length).toBe(2)
    adapter?.highlightBlocks([3])
    expect(framedLines(el)).toEqual(['Tail'])
    adapter?.highlightBlocks([])
    expect(framed(el).length).toBe(0)
  })

  it('frames a table holding a match alongside the text blocks', async () => {
    const el = await open('# dog\n\n| a | b |\n| --- | --- |\n| dog | 2 |\n\nTail dog\n')
    adapter?.highlightBlocks([0, 1, 2])
    expect(el.querySelector('.folio-table-framed')?.tagName).toBe('TABLE')
    expect(framedLines(el)).toEqual(['# dog', 'Tail dog'])
  })

  it('leaves the caret, the selection, and the file alone', async () => {
    const el = await open('# dog\n\nBody\n\nMore dog\n')
    const view = (adapter as unknown as { view: EditorView }).view
    const changes: string[] = []
    adapter?.onChange((markdown) => changes.push(markdown))
    view.dispatch({ selection: { anchor: 1 } })
    adapter?.highlightBlocks([0, 2])
    expect(view.state.selection.main.anchor).toBe(1)
    expect(changes).toEqual([])
    expect(el.textContent).toBe('# dogBodyMore dog')
  })

  it('ignores an index the document does not hold', async () => {
    const el = await open('# dog\n\nBody\n')
    adapter?.highlightBlocks([0, 9])
    expect(framedLines(el)).toEqual(['# dog'])
  })
})
