import { describe, expect, it } from 'vitest'
import { FakeEditor } from './fakeEditor'

// The fake is the test contract for the seam (design D1): the app logic and
// the pane are built on these behaviors, so the fake must honor them exactly.

describe('FakeEditor (EditorAdapter test double)', () => {
  it('records setContent calls and keeps the content', () => {
    const editor = new FakeEditor()
    expect(editor.getContent()).toBe('')
    void editor.setContent('# hi')
    void editor.setContent('two')
    expect(editor.getContent()).toBe('two')
    expect(editor.setContents).toEqual(['# hi', 'two'])
  })

  it('mounts and destroys', async () => {
    const editor = new FakeEditor()
    expect(editor.mounted).toBe(false)
    await editor.mount(document.createElement('div'))
    expect(editor.mounted).toBe(true)
    await editor.destroy()
    expect(editor.destructed).toBe(true)
  })

  it('emits change events to registered listeners with the new markdown', () => {
    const editor = new FakeEditor()
    const seen: string[] = []
    editor.onChange((md) => seen.push(md))
    editor.emitChange('# edited')
    editor.emitChange('more')
    expect(seen).toEqual(['# edited', 'more'])
    expect(editor.getContent()).toBe('more')
  })
})