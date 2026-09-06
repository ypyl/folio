import { act, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EditorAdapter } from '../editor/editor'
import { EditorPane } from './EditorPane'

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
})