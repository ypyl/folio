import { describe, expect, it } from 'vitest'
import { DEFAULT_BOARD_BACKGROUND, parseScene, sceneSignature } from './boardScene'

// The pure half of the board host (add-whiteboards, design D7): what counts as
// a board change, and how a board file is read into a mountable scene.

describe('sceneSignature', () => {
  it('is stable for the same elements', () => {
    const elements = [
      { id: 'a', version: 1 },
      { id: 'b', version: 2 },
    ]
    expect(sceneSignature(elements)).toBe(sceneSignature(elements))
  })

  it('changes when an element version changes', () => {
    const before = sceneSignature([{ id: 'a', version: 1 }])
    const after = sceneSignature([{ id: 'a', version: 2 }])
    expect(after).not.toBe(before)
  })

  it('changes when an element is added or removed', () => {
    const one = sceneSignature([{ id: 'a', version: 1 }])
    const two = sceneSignature([
      { id: 'a', version: 1 },
      { id: 'b', version: 1 },
    ])
    expect(two).not.toBe(one)
    expect(sceneSignature([])).not.toBe(one)
  })

  it('treats a missing version as zero', () => {
    expect(sceneSignature([{ id: 'a' }])).toBe(sceneSignature([{ id: 'a', version: 0 }]))
  })
})

describe('parseScene', () => {
  it('reads elements, appState, and files from a saved board', () => {
    const scene = JSON.stringify({
      type: 'excalidraw',
      elements: [{ id: 'a', version: 1 }],
      appState: { gridSize: 20 },
      files: { f1: {} },
    })
    const parsed = parseScene(scene)
    expect(parsed.elements).toHaveLength(1)
    // The board named no background, so the app's parchment is filled in.
    expect(parsed.appState).toEqual({ gridSize: 20, viewBackgroundColor: DEFAULT_BOARD_BACKGROUND })
    expect(parsed.files).toEqual({ f1: {} })
  })

  it('reads an empty file as a blank board on the parchment default', () => {
    const blank = {
      elements: [],
      appState: { viewBackgroundColor: DEFAULT_BOARD_BACKGROUND },
      files: {},
    }
    expect(parseScene('')).toEqual(blank)
    expect(parseScene('   \n')).toEqual(blank)
  })

  it('reads an unparseable file as a blank board rather than throwing', () => {
    expect(parseScene('not json at all')).toEqual({
      elements: [],
      appState: { viewBackgroundColor: DEFAULT_BOARD_BACKGROUND },
      files: {},
    })
  })

  it('tolerates a scene with no elements array', () => {
    expect(parseScene('{"type":"excalidraw"}')).toEqual({
      elements: [],
      appState: { viewBackgroundColor: DEFAULT_BOARD_BACKGROUND },
      files: {},
    })
  })

  it('keeps a background the board already names', () => {
    const scene = JSON.stringify({ appState: { viewBackgroundColor: '#fffce8' } })
    expect(parseScene(scene).appState.viewBackgroundColor).toBe('#fffce8')
  })

  it('uses the app parchment, not the editor white default', () => {
    expect(DEFAULT_BOARD_BACKGROUND).toBe('#f5f4ed')
    expect(parseScene('').appState.viewBackgroundColor).toBe('#f5f4ed')
  })
})
