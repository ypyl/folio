import { describe, expect, it, vi } from 'vitest'
import { ACTIVITY_CAP, appendActivity, EMPTY_ACTIVITY, type ActivityEntry } from './activity'
import type { TraceSink } from '../trace/session'

function entry(tool: string, path = 'pages/Inbox.md', at = 1): ActivityEntry {
  return { at, tool, path, added: 2, removed: 1 }
}

function fakeSink() {
  return { event: vi.fn() } satisfies TraceSink
}

describe('the agent activity record (add-agent-activity-log)', () => {
  it('puts the newest entry first', () => {
    const list = appendActivity(
      appendActivity(EMPTY_ACTIVITY, entry('edit_note')),
      entry('create_note'),
    )
    expect(list.map((one) => one.tool)).toEqual(['create_note', 'edit_note'])
  })

  it('keeps one shared empty record', () => {
    expect(EMPTY_ACTIVITY.length).toBe(0)
    expect(appendActivity(EMPTY_ACTIVITY, entry('edit_note'))).not.toBe(EMPTY_ACTIVITY)
    expect(EMPTY_ACTIVITY.length).toBe(0)
  })

  it('drops the oldest past the cap', () => {
    let list = EMPTY_ACTIVITY
    for (let i = 0; i < ACTIVITY_CAP + 3; i += 1) {
      list = appendActivity(list, entry(`tool-${i}`, 'pages/Inbox.md', i))
    }
    expect(list).toHaveLength(ACTIVITY_CAP)
    expect(list[0].tool).toBe(`tool-${ACTIVITY_CAP + 2}`)
    expect(list[list.length - 1].tool).toBe('tool-3')
  })

  it('writes exactly one trace line per entry, naming no page text', () => {
    const sink = fakeSink()
    const list = appendActivity(EMPTY_ACTIVITY, entry('edit_note'), sink)
    expect(sink.event).toHaveBeenCalledTimes(1)
    expect(sink.event).toHaveBeenCalledWith('info', 'agent', {
      tool: 'edit_note',
      path: 'pages/Inbox.md',
      added: 2,
      removed: 1,
    })
    // The durable half of an entry is its fields: nothing else is written, so no
    // page text can reach the trace (ADR-0035).
    expect(Object.keys(list[0]).sort()).toEqual(['added', 'at', 'path', 'removed', 'tool'])
  })

  it('records without a sink', () => {
    expect(() => appendActivity(EMPTY_ACTIVITY, entry('edit_note'))).not.toThrow()
  })
})
