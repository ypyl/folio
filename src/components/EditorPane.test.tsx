import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EditorAdapter } from '../editor/editor'
import { EditorPane } from './EditorPane'
import styles from './EditorPane.module.css'
import { collectDropFiles, linkForAsset } from './dropAssets'

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
  setContents: string[]
  insertions: string[]
  emitChange: (markdown: string) => void
  destructed: boolean
  mounted: boolean
}

afterEach(() => {
  instances.list.length = 0
})

describe('EditorPane', () => {
  it('renders only the editor surface with the initial content and no title heading', async () => {
    render(
      <EditorPane page={{ ...page, title: 'Welcome' }} initialContent="# hello" onChange={() => {}} />,
    )
    // The pane shows the file content only: no page-title heading is rendered.
    expect(within(screen.getByRole('main')).queryByRole('heading', { level: 1 })).toBeNull()
    await act(async () => {})
    const editor = fake()
    expect(editor.mounted).toBe(true)
    expect(editor.setContents).toEqual(['# hello'])
    expect(editor.getContent()).toBe('# hello')
  })

  it('forwards edits to onChange with the serialized markdown', async () => {
    const onChange = vi.fn()
    render(
      <EditorPane page={page} initialContent="v1" onChange={onChange} />,
    )
    await act(async () => {})
    await act(async () => {
      fake().emitChange('# edited')
    })
    expect(onChange).toHaveBeenCalledWith('# edited')
  })

  it('destroys the editor on unmount', async () => {
    const { unmount } = render(
      <EditorPane page={page} initialContent="v1" onChange={() => {}} />,
    )
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

  it('shows the empty states without mounting an editor', async () => {
    const { rerender } = render(
      <EditorPane page={null} emptyHint="notes" initialContent="" onChange={() => {}} />,
    )
    expect(screen.getByText('Your notes appear here.')).toBeTruthy()
    rerender(
      <EditorPane page={null} emptyHint="open-folder" initialContent="" onChange={() => {}} />,
    )
    expect(screen.getByText('Open a folder to begin.')).toBeTruthy()
    expect(instances.list).toHaveLength(0)
  })

  it('shows the loading state instead of the empty hint while the index builds', async () => {
    render(
      <EditorPane page={null} loading emptyHint="notes" initialContent="" onChange={() => {}} />,
    )
    // The status label is real content; the old hint is gone.
    expect(screen.getByRole('status').textContent).toBe('Indexing notes…')
    expect(screen.queryByText('Your notes appear here.')).toBeNull()
    expect(screen.queryByText('Open a folder to begin.')).toBeNull()
    // Placeholders are decorative, never read as content.
    const main = screen.getByRole('main')
    expect(main.querySelector('[aria-hidden="true"] .skeleton')).not.toBeNull()
    // No editor is mounted for a placeholder surface.
    expect(instances.list).toHaveLength(0)
  })

  describe('save indicator (design D4)', () => {
    it.each([
      ['dirty', 'Unsaved changes'],
      ['saving', 'Saving…'],
      ['failed', 'Save failed'],
    ] as const)('shows %s as %s', async (status, label) => {
      render(
        <EditorPane page={page} initialContent="v1" onChange={() => {}} saveState={status} />,
      )
      expect(screen.getByRole('status').textContent).toBe(label)
    })

    it('shows nothing while clean', async () => {
      render(
        <EditorPane page={page} initialContent="v1" onChange={() => {}} saveState="clean" />,
      )
      expect(screen.queryByRole('status')).toBeNull()
    })
  })

  describe('pane scroll (fix-editor-scroll-jump)', () => {
    it('keeps the scroll position when the same page refreshes, resets on page switch', async () => {
      const a = { ...page, path: 'a.md' }
      const { rerender } = render(
        <EditorPane page={a} initialContent="x" onChange={() => {}} />,
      )
      await act(async () => {})
      const pane = screen.getByRole('main') as HTMLElement
      pane.scrollTop = 400

      // Same path, new object — the post-save index rebuild. Scroll survives.
      rerender(<EditorPane page={{ ...a, content: 'y' }} initialContent="x" onChange={() => {}} />)
      expect(pane.scrollTop).toBe(400)

      // A real page switch resets the pane to the top.
      rerender(<EditorPane key="b.md" page={{ ...page, path: 'b.md' }} initialContent="z" onChange={() => {}} />)
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
      expect(collectDropFiles(dt)).toEqual([f])
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
      const onDropFiles = vi.fn(async () => ['assets/a.png', 'assets/b.pdf'])
      render(
        <EditorPane page={page} initialContent="x" onChange={() => {}} onDropFiles={onDropFiles} />,
      )
      await act(async () => {})
      fireEvent.drop(screen.getByRole('main'), {
        dataTransfer: dt([new File(['a'], 'a.png'), new File(['b'], 'b.pdf')]),
      })
      await act(async () => {})
      const editor = fake()
      expect(editor.insertions).toEqual(['![a](assets/a.png)', '[b](assets/b.pdf)'])
    })

    it('never calls onDropFiles when no page is open', async () => {
      const onDropFiles = vi.fn()
      render(<EditorPane page={null} initialContent="" onChange={() => {}} onDropFiles={onDropFiles} />)
      fireEvent.drop(screen.getByRole('main'), { dataTransfer: dt([new File(['x'], 'x.png')]) })
      await act(async () => {})
      expect(onDropFiles).not.toHaveBeenCalled()
    })
  })
})