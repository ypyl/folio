import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useActivity } from './useActivity'
import type { TraceSink } from '../trace/session'

function sink(): TraceSink {
  return { event: vi.fn() }
}

const entry = (tool: string) => ({
  at: 1_700_000_000_000,
  tool,
  path: 'pages/Inbox.md',
  added: 2,
  removed: 1,
})

describe('the session activity recorder (add-agent-activity-log)', () => {
  it('records nothing while the gate is off', () => {
    const trace = sink()
    const { result } = renderHook(() => useActivity(false, trace))
    act(() => result.current.record(entry('edit_note')))
    expect(result.current.entries).toHaveLength(0)
    expect(trace.event).not.toHaveBeenCalled()
  })

  it('records newest first and mirrors each entry into the trace', () => {
    const trace = sink()
    const { result } = renderHook(() => useActivity(true, trace))
    act(() => result.current.record(entry('edit_note')))
    act(() => result.current.record(entry('create_note')))
    expect(result.current.entries.map((one) => one.tool)).toEqual(['create_note', 'edit_note'])
    expect(trace.event).toHaveBeenCalledTimes(2)
    expect(trace.event).toHaveBeenLastCalledWith('info', 'agent', {
      tool: 'create_note',
      path: 'pages/Inbox.md',
      added: 2,
      removed: 1,
    })
  })

  it('drops the record when the session changes', () => {
    const { result } = renderHook(() => useActivity(true, null))
    act(() => result.current.record(entry('edit_note')))
    act(() => result.current.reset())
    expect(result.current.entries).toHaveLength(0)
  })
})
