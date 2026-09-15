import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EditorAdapter } from '../editor/editor'
import type { Suggestion } from '../vault/suggest'
import { EditorPane, type EditorPaneHandle } from './EditorPane'
import styles from './EditorPane.module.css'
import { collectFiles, linkForAsset, withPastedName } from './dropAssets'

// Replace the real ProseMirror transport with FakeEditor for component tests
// (design D1): the pane is tested against the seam contract. Instances are
// registered so tests can drive changes and assert what was loaded.
const instances = vi.hoisted(() => ({ list: [] as EditorAdapter[] }))
vi.mock('../editor/milkdown', async () => {
  const { FakeEditor } = await import('../editor/fakeEditor')
  return {
    MilkdownAdapter: class extends FakeEditor {
      constructor() {
        super()
        instances.list.push(this)
      }
    },
  }
})

const page = { path: 'notes.md', title: 'notes', kind: 'page' as const, content: '' }

function fake(): FakeEditorView {
  return instances.list[instances.list.length - 1] as FakeEditorView
}

type FakeEditorView = EditorAdapter & {
  content: string
  setContents: string[]
  insertions: string[]
  chords: string[]
  emitChange: (markdown: string) => void
  emitReferenceClick: (target: string) => void
  destructed: boolean
  mounted: boolean
  suggest: (query: string) => Suggestion[]
}

afterEach(() => {
  instances.list.length = 0
})

describe('EditorPane', () => {
  it('renders only the editor surface with the initial content and no title heading', async () => {
    render(
      <EditorPane
        page={{ ...page, title: 'Welcome' }}
        initialContent="# hello"
        onChange={() => {}}
      />,
    )
    // The pane shows the file content only: no page-title heading is rendered.
    expect(within(screen.getByRole('main')).queryByRole('heading', { level: 1 })).toBeNull()
    await act(async () => {})
    const editor = fake()
    expect(editor.mounted).toBe(true)
    expect(editor.setContents).toEqual(['# hello'])
    expect(editor.content).toBe('# hello')
  })

  it('forwards edits to onChange with the serialized markdown', async () => {
    const onChange = vi.fn()
    render(<EditorPane page={page} initialContent="v1" onChange={onChange} />)
    await act(async () => {})
    await act(async () => {
      fake().emitChange('# edited')
    })
    expect(onChange).toHaveBeenCalledWith('# edited')
  })

  it('forwards a reference activation to onOpenReference with its target', async () => {
    const onOpenReference = vi.fn()
    render(
      <EditorPane
        page={page}
        initialContent="See #Inbox"
        onChange={() => {}}
        onOpenReference={onOpenReference}
      />,
    )
    await act(async () => {})
    await act(async () => {
      fake().emitReferenceClick('Inbox')
    })
    expect(onOpenReference).toHaveBeenCalledWith('Inbox')
  })

  // The adapter mounts once, so the pane hands the source over through a ref and
  // the live one is the app's current pool (add-reference-autocomplete, D8).
  it('gives the editor the completion source, keeping it current across renders', async () => {
    const first = (): Suggestion[] => [{ name: 'reading', path: 'reading.md', match: [0, 4] }]
    const second = (): Suggestion[] => [
      { name: 'reading list', path: 'reading list.md', match: [0, 4] },
    ]
    const { rerender } = render(
      <EditorPane page={page} initialContent="" onChange={() => {}} suggest={first} />,
    )
    await act(async () => {})
    expect(
      fake()
        .suggest('read')
        .map((row) => row.name),
    ).toEqual(['reading'])
    rerender(<EditorPane page={page} initialContent="" onChange={() => {}} suggest={second} />)
    expect(
      fake()
        .suggest('read')
        .map((row) => row.name),
    ).toEqual(['reading list'])
  })

  it('offers nothing when the app supplies no completion source', async () => {
    render(<EditorPane page={page} initialContent="" onChange={() => {}} />)
    await act(async () => {})
    expect(fake().suggest('read')).toEqual([])
  })

  it('destroys the editor on unmount', async () => {
    const { unmount } = render(<EditorPane page={page} initialContent="v1" onChange={() => {}} />)
    await act(async () => {})
    const editor = fake()
    unmount()
    expect(editor.destructed).toBe(true)
  })

  it('renders a canonical line number per block in the inert gutter', async () => {
    const seed = '# Title\n\nBody\n\n- a\n- b\n'
    render(<EditorPane page={page} initialContent={seed} onChange={() => {}} />)
    await act(async () => {})
    const editor = fake()
    // The gutter numbers come from the shared anchor rule, not the DOM
    // (jsdom rects are all zero; the numbers themselves are the contract).
    expect(editor.getBlockLines()).toEqual([1, 3, 5])
    const gutter = document.querySelector(`.${styles.gutter}`)
    expect(gutter).not.toBeNull()
    const nums = [...(gutter?.querySelectorAll('span') ?? [])].map((s) => s.textContent)
    expect(nums).toEqual(['1', '3', '5'])
  })

  it('re-numbers the gutter when the document changes', async () => {
    render(<EditorPane page={page} initialContent={'Body'} onChange={() => {}} />)
    await act(async () => {})
    const editor = fake()
    await act(async () => {
      editor.emitChange('# New\n\nBody')
    })
    const gutter = document.querySelector(`.${styles.gutter}`)
    const nums = [...(gutter?.querySelectorAll('span') ?? [])].map((s) => s.textContent)
    expect(nums).toEqual(['1', '3'])
  })

  it('shows line 1 for the placeholder block of an empty page', async () => {
    render(<EditorPane page={page} initialContent={''} onChange={() => {}} />)
    await act(async () => {})
    const gutter = document.querySelector(`.${styles.gutter}`)
    const nums = [...(gutter?.querySelectorAll('span') ?? [])].map((s) => s.textContent)
    expect(nums).toEqual(['1'])
  })

  it('points a vault image reference at the file bytes through the reader', async () => {
    const read = vi.fn(async () => new Blob(['png']))
    const { unmount } = render(
      <EditorPane
        page={page}
        initialContent={'![photo](assets/photo.png)'}
        onChange={() => {}}
        readAsset={read}
      />,
    )
    // The editor renders the reference as an image element; the pane points it
    // at the file's bytes.
    const img = await waitFor(() => {
      const el = document.querySelector(`main img`)
      expect(el).not.toBeNull()
      return el as HTMLImageElement
    })
    await waitFor(() => expect(read).toHaveBeenCalledWith('assets/photo.png'))
    await waitFor(() => expect(img.getAttribute('src')).toMatch(/^blob:/))
    expect(img.getAttribute('alt')).toBe('photo')
    // The document text is untouched: only the rendered element was re-pointed.
    expect(fake().content).toBe('![photo](assets/photo.png)')
    // The page's URLs go with its editor.
    const url = img.getAttribute('src')
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    unmount()
    expect(revoke.mock.calls.map(([u]) => u)).toContain(url)
    revoke.mockRestore()
  })

  it('leaves vault image references alone without a reader', async () => {
    render(
      <EditorPane page={page} initialContent={'![photo](assets/photo.png)'} onChange={() => {}} />,
    )
    const img = await waitFor(() => {
      const el = document.querySelector(`main img`)
      expect(el).not.toBeNull()
      return el as HTMLImageElement
    })
    expect(img.getAttribute('src')).toBe('assets/photo.png')
  })

  it('shows the empty states without mounting an editor', async () => {
    // The open-folder hint is the supported-browser case: stub the picker the
    // brand screen is gated on (warn-unsupported-browser).
    vi.stubGlobal('showDirectoryPicker', vi.fn())
    try {
      const { rerender } = render(
        <EditorPane page={null} emptyHint="notes" initialContent="" onChange={() => {}} />,
      )
      expect(screen.getByText('Your notes appear here.')).toBeTruthy()
      rerender(
        <EditorPane page={null} emptyHint="open-folder" initialContent="" onChange={() => {}} />,
      )
      expect(screen.getByText('Open a folder to begin.')).toBeTruthy()
      expect(instances.list).toHaveLength(0)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('states the browser requirement when the browser cannot open folders', async () => {
    render(
      <EditorPane
        page={null}
        emptyHint="browser-unsupported"
        initialContent=""
        onChange={() => {}}
      />,
    )
    // The requirement replaces the instruction: "open a folder" is not
    // something this browser can do (warn-unsupported-browser).
    expect(
      screen.getByText(
        'Folio needs a Chromium-based browser to open a local folder. Use Chrome, Edge, or Brave.',
      ),
    ).toBeTruthy()
    expect(screen.queryByText('Open a folder to begin.')).toBeNull()
    // The mark stays decorative and the screen stays control-free.
    expect(screen.getByRole('main').querySelector('[aria-hidden="true"]')).not.toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    expect(instances.list).toHaveLength(0)
  })

  it('shows the loading state instead of the empty hint while the index builds', async () => {
    render(
      <EditorPane page={null} loading emptyHint="notes" initialContent="" onChange={() => {}} />,
    )
    // The in-progress status is announced in the status bar, not here
    // (add-status-bar); the pane keeps only the decorative skeleton lines.
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByText('Your notes appear here.')).toBeNull()
    expect(screen.queryByText('Open a folder to begin.')).toBeNull()
    // Placeholders are decorative, never read as content.
    const main = screen.getByRole('main')
    expect(main.querySelector('[aria-hidden="true"] .skeleton')).not.toBeNull()
    // No editor is mounted for a placeholder surface.
    expect(instances.list).toHaveLength(0)
  })

  describe('pane scroll (fix-editor-scroll-jump)', () => {
    it('keeps the scroll position when the same page refreshes, resets on page switch', async () => {
      const a = { ...page, path: 'a.md' }
      const { rerender } = render(<EditorPane page={a} initialContent="x" onChange={() => {}} />)
      await act(async () => {})
      const pane = screen.getByRole('main') as HTMLElement
      pane.scrollTop = 400

      // Same path, new object — the post-save index rebuild. Scroll survives.
      rerender(<EditorPane page={{ ...a, content: 'y' }} initialContent="x" onChange={() => {}} />)
      expect(pane.scrollTop).toBe(400)

      // A real page switch resets the pane to the top.
      rerender(
        <EditorPane
          key="b.md"
          page={{ ...page, path: 'b.md' }}
          initialContent="z"
          onChange={() => {}}
        />,
      )
      await act(async () => {})
      expect((screen.getByRole('main') as HTMLElement).scrollTop).toBe(0)
    })
  })

  describe('empty-page placeholder (journal-home)', () => {
    // The pane gates the hint with data-empty; the copy rides the inheriting
    // --placeholder variable so the CSS ::before on the empty paragraph can
    // read it (attr() would look on the <p> itself, which Milkdown owns).
    const editorEl = () =>
      (screen.getByRole('main') as HTMLElement).querySelector<HTMLElement>('[data-empty]')

    it('shows the placeholder on an empty page', async () => {
      render(<EditorPane page={page} initialContent="" onChange={() => {}} />)
      await act(async () => {})
      const el = editorEl()
      expect(el).not.toBeNull()
      expect(el!.style.getPropertyValue('--placeholder').replace(/^'|'$/g, '')).toBe(
        'Start typing…',
      )
    })

    it('never shows the placeholder on a page with content', async () => {
      render(<EditorPane page={page} initialContent="# hello" onChange={() => {}} />)
      await act(async () => {})
      expect(editorEl()).toBeNull()
    })

    it('returns the placeholder when all content is deleted', async () => {
      const onChange = vi.fn()
      render(<EditorPane page={page} initialContent="v1" onChange={onChange} />)
      await act(async () => {})
      expect(editorEl()).toBeNull()
      await act(async () => {
        fake().emitChange('')
      })
      expect(editorEl()).not.toBeNull()
      expect(onChange).toHaveBeenCalledWith('')
    })
  })

  describe('asset drop (asset-drag-drop)', () => {
    const dt = (files: File[]): DataTransfer =>
      ({
        files,
        items: files.map((f) => ({ kind: 'file', getAsFile: () => f })),
      }) as unknown as DataTransfer

    it('collects plain files and ignores directories', () => {
      const f = new File(['x'], 'a.png')
      const dir = new File([], 'folder')
      const dt = {
        items: [
          { kind: 'file', getAsFile: () => f },
          { kind: 'file', webkitGetAsEntry: () => ({ isDirectory: true }), getAsFile: () => dir },
        ],
      } as unknown as DataTransfer
      expect(collectFiles(dt)).toEqual([f])
    })

    it.each([
      ['image.png', /^pasted-\d{8}-\d{6}\.png$/],
      ['blob', /^pasted-\d{8}-\d{6}\.png$/],
      ['image.jpeg', /^pasted-\d{8}-\d{6}\.jpeg$/],
      ['Q3 report.pdf', /^Q3 report\.pdf$/],
      ['pasted-20260101-101010.png', /^pasted-20260101-101010\.png$/],
    ])('withPastedName(%s) names the asset', (name, expected) => {
      const named = withPastedName(new File(['x'], name, { type: 'image/png' }))
      expect(named.name).toMatch(expected)
      // The bytes and the type survive the rename.
      expect(named.type).toBe('image/png')
    })

    it('names a nameless bitmap from its MIME type so it still links as an image', () => {
      const named = withPastedName(new File(['x'], 'blob', { type: 'image/webp' }))
      expect(named.name).toMatch(/^pasted-\d{8}-\d{6}\.webp$/)
      expect(linkForAsset(`assets/${named.name}`)).toMatch(/^!\[/)
    })

    it.each([
      ['assets/photo.png', '![photo](assets/photo.png)'],
      ['assets/photo-1.png', '![photo-1](assets/photo-1.png)'],
      ['assets/notes.pdf', '[notes](assets/notes.pdf)'],
      ['assets/IMG.JPG', '![IMG](assets/IMG.JPG)'],
      ['assets/noext', '[noext](assets/noext)'],
    ])('linkForAsset(%s) -> %s', (path, expected) => {
      expect(linkForAsset(path)).toBe(expected)
    })

    it('inserts one link per landed file at the cursor (image vs plain)', async () => {
      const onAttachFiles = vi.fn(async () => ['assets/a.png', 'assets/b.pdf'])
      render(
        <EditorPane
          page={page}
          initialContent="x"
          onChange={() => {}}
          onAttachFiles={onAttachFiles}
        />,
      )
      await act(async () => {})
      fireEvent.drop(screen.getByRole('main'), {
        dataTransfer: dt([new File(['a'], 'a.png'), new File(['b'], 'b.pdf')]),
      })
      await act(async () => {})
      const editor = fake()
      expect(editor.insertions).toEqual(['![a](assets/a.png)', '[b](assets/b.pdf)'])
    })

    it('never calls onAttachFiles when no page is open', async () => {
      const onAttachFiles = vi.fn()
      render(
        <EditorPane
          page={null}
          initialContent=""
          onChange={() => {}}
          onAttachFiles={onAttachFiles}
        />,
      )
      fireEvent.drop(screen.getByRole('main'), { dataTransfer: dt([new File(['x'], 'x.png')]) })
      await act(async () => {})
      expect(onAttachFiles).not.toHaveBeenCalled()
    })
  })

  describe('pasted files (attach-pasted-files)', () => {
    // jsdom has no DataTransfer, so a clipboard is the same plain shape the drop
    // tests use, plus the text the handler reads (design D2).
    const clipboard = (files: File[], text = ''): DataTransfer =>
      ({
        files,
        items: files.map((f) => ({ kind: 'file', getAsFile: () => f })),
        getData: () => text,
      }) as unknown as DataTransfer

    it('attaches a pasted bitmap under a timestamped name and links it', async () => {
      const onAttachFiles = vi.fn(async (files: File[]) => files.map((f) => `assets/${f.name}`))
      render(
        <EditorPane
          page={page}
          initialContent="x"
          onChange={() => {}}
          onAttachFiles={onAttachFiles}
        />,
      )
      await act(async () => {})
      const bitmap = new File(['png'], 'image.png', { type: 'image/png' })
      await act(async () => {
        fireEvent.paste(screen.getByRole('main'), { clipboardData: clipboard([bitmap]) })
      })
      const sent = onAttachFiles.mock.calls[0][0]
      expect(sent).toHaveLength(1)
      expect(sent[0].name).toMatch(/^pasted-\d{8}-\d{6}\.png$/)
      expect(fake().insertions).toEqual([
        `![${sent[0].name.replace('.png', '')}](assets/${sent[0].name})`,
      ])
    })

    it('keeps the name of a pasted file that has one', async () => {
      const onAttachFiles = vi.fn(async (_files: File[]) => ['assets/Q3 report.pdf'])
      render(
        <EditorPane
          page={page}
          initialContent="x"
          onChange={() => {}}
          onAttachFiles={onAttachFiles}
        />,
      )
      await act(async () => {})
      const pdf = new File(['pdf'], 'Q3 report.pdf', { type: 'application/pdf' })
      await act(async () => {
        fireEvent.paste(screen.getByRole('main'), { clipboardData: clipboard([pdf]) })
      })
      expect(onAttachFiles.mock.calls[0][0][0].name).toBe('Q3 report.pdf')
      expect(fake().insertions).toEqual(['[Q3 report](assets/Q3 report.pdf)'])
    })

    it('leaves a clipboard with text to the editor, files and all', async () => {
      const onAttachFiles = vi.fn(async (_files: File[]) => ['assets/a.png'])
      render(
        <EditorPane
          page={page}
          initialContent="x"
          onChange={() => {}}
          onAttachFiles={onAttachFiles}
        />,
      )
      await act(async () => {})
      const clipboard2 = clipboard([new File(['png'], 'image.png')], 'plain text')
      fireEvent.paste(screen.getByRole('main'), { clipboardData: clipboard2 })
      await act(async () => {})
      expect(onAttachFiles).not.toHaveBeenCalled()
      expect(fake().insertions).toEqual([])
    })

    it('attaches nothing with no page open or an empty clipboard', async () => {
      const onAttachFiles = vi.fn(async (_files: File[]) => [])
      const { rerender } = render(
        <EditorPane
          page={null}
          initialContent=""
          onChange={() => {}}
          onAttachFiles={onAttachFiles}
        />,
      )
      fireEvent.paste(screen.getByRole('main'), {
        clipboardData: clipboard([new File(['x'], 'x.png')]),
      })
      rerender(
        <EditorPane
          page={page}
          initialContent="x"
          onChange={() => {}}
          onAttachFiles={onAttachFiles}
        />,
      )
      await act(async () => {})
      fireEvent.paste(screen.getByRole('main'), { clipboardData: clipboard([]) })
      await act(async () => {})
      expect(onAttachFiles).not.toHaveBeenCalled()
    })

    it('inserts no link for a file whose copy failed', async () => {
      const onAttachFiles = vi.fn(async (_files: File[]) => ['assets/one.png'])
      render(
        <EditorPane
          page={page}
          initialContent="x"
          onChange={() => {}}
          onAttachFiles={onAttachFiles}
        />,
      )
      await act(async () => {})
      await act(async () => {
        fireEvent.paste(screen.getByRole('main'), {
          clipboardData: clipboard([
            new File(['1'], 'image.png', { type: 'image/png' }),
            new File(['2'], 'image.png', { type: 'image/png' }),
          ]),
        })
      })
      // Two files pasted, one copy landed: exactly one link, no placeholder for
      // the one that did not.
      expect(fake().insertions).toHaveLength(1)
    })
  })

  // The app applies a chord by asking the editor to replay it
  // (apply-shortcuts-on-click, design D8).
  describe('applyChord handle', () => {
    it('forwards the chord to the mounted adapter', async () => {
      const ref = createRef<EditorPaneHandle>()
      render(<EditorPane ref={ref} page={page} initialContent="v1" onChange={() => {}} />)
      await act(async () => {})
      expect(ref.current).not.toBeNull()
      act(() => {
        ref.current?.applyChord('Mod-b')
      })
      expect(fake().chords).toEqual(['Mod-b'])
    })

    it('reports false when no editor is mounted', async () => {
      const ref = createRef<EditorPaneHandle>()
      render(<EditorPane ref={ref} page={null} initialContent="" onChange={() => {}} />)
      await act(async () => {})
      expect(ref.current?.applyChord('Mod-b')).toBe(false)
    })
  })
})
