import { describe, expect, it } from 'vitest'
import {
  ASSET_DRAG_TYPE,
  PAGE_DRAG_TYPE,
  dragRefText,
  hasDragRef,
  readDragRef,
  writeDragRef,
  type DragRef,
} from './dragRefs'

// A DataTransfer stand-in with only what this module touches: jsdom does not
// implement drag-and-drop, and the module reads `setData`/`getData`/`types`
// exactly as a browser's own transfer exposes them.
function fakeTransfer(initial: Record<string, string> = {}): DataTransfer {
  const store = new Map(Object.entries(initial))
  return {
    get types() {
      return [...store.keys()]
    },
    getData: (type: string) => store.get(type) ?? '',
    setData: (type: string, value: string) => void store.set(type, value),
    effectAllowed: 'none',
  } as unknown as DataTransfer
}

// drag-references-into-editor, design D1: the row carries the fact it names,
// and this one module turns that fact into the Markdown the app writes.
describe('dragRefText', () => {
  it.each([
    [{ kind: 'asset', path: 'assets/q3-report.pdf' }, '[q3-report](assets/q3-report.pdf)'],
    [{ kind: 'asset', path: 'assets/shot.png' }, '![shot](assets/shot.png)'],
    [
      { kind: 'asset', path: 'assets/2026/q3-report.pdf' },
      '[q3-report](assets/2026/q3-report.pdf)',
    ],
    [{ kind: 'asset', path: 'assets/Q3 report.pdf' }, '[Q3 report](assets/Q3%20report.pdf)'],
  ] as [DragRef, string][])('writes %o as %s', (ref, expected) => {
    expect(dragRefText(ref)).toBe(expected)
  })

  it('writes a page in the canonical token form for its name', () => {
    expect(dragRefText({ kind: 'page', name: 'reading' })).toBe('#reading')
    expect(dragRefText({ kind: 'page', name: 'reading list' })).toBe('#[[reading list]]')
    expect(dragRefText({ kind: 'page', name: '2026-09-18' })).toBe('#2026-09-18')
  })
})

describe('writeDragRef / readDragRef', () => {
  it('round-trips a file payload', () => {
    const dt = fakeTransfer()
    writeDragRef(dt, { kind: 'asset', path: 'assets/shot.png' })
    expect(dt.getData(ASSET_DRAG_TYPE)).toBe('assets/shot.png')
    expect(readDragRef(dt)).toEqual({ kind: 'asset', path: 'assets/shot.png' })
    // A drag here copies nothing and creates nothing, and the cursor says so.
    expect(dt.effectAllowed).toBe('copy')
  })

  it('round-trips a page payload', () => {
    const dt = fakeTransfer()
    writeDragRef(dt, { kind: 'page', name: 'reading list' })
    expect(dt.getData(PAGE_DRAG_TYPE)).toBe('reading list')
    expect(readDragRef(dt)).toEqual({ kind: 'page', name: 'reading list' })
  })

  it('reads anything else as null', () => {
    expect(readDragRef(fakeTransfer())).toBeNull()
    expect(readDragRef(fakeTransfer({ 'text/plain': 'assets/shot.png' }))).toBeNull()
    // An empty value names nothing, so it writes nothing.
    expect(readDragRef(fakeTransfer({ [ASSET_DRAG_TYPE]: '' }))).toBeNull()
  })
})

describe('hasDragRef', () => {
  // During `dragover` the platform exposes the types but not the payload, which
  // is why the drop target asks this before the drop.
  it('answers from the types alone', () => {
    const dt = fakeTransfer()
    expect(hasDragRef(dt)).toBe(false)
    dt.setData(ASSET_DRAG_TYPE, 'X')
    expect(hasDragRef(dt)).toBe(true)
  })
})
