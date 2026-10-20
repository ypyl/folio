import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ConfirmReminderReplace } from './ConfirmReminderReplace'
import { describeSchedule } from './recurrences'

// confirm-replacing-a-reminder: choosing a recurrence for a page that already
// has one asks first. The dialog names both schedules, starts focus on Cancel,
// and reports Replace and Cancel as distinct single outcomes.

// jsdom 30 has no <dialog> modal API (the app test's precedent): stub the two
// methods so the component's real open path runs and role queries can see it.
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    writable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute('open', '')
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const open = (onConfirm = vi.fn(), onCancel = vi.fn()) =>
  render(
    <ConfirmReminderReplace
      page="Take pills"
      from={{ recurrence: 'daily', anchor: '2026-10-06' }}
      to={{ recurrence: 'weekly', anchor: '2026-10-20' }}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  )

describe('describeSchedule', () => {
  it('names a recurrence from its anchor and a once rule by its day', () => {
    expect(describeSchedule({ recurrence: 'daily', anchor: '2026-10-06' })).toBe(
      'every day from October 6, 2026',
    )
    expect(describeSchedule({ recurrence: 'once', anchor: '2026-10-20' })).toBe(
      'once, on October 20, 2026',
    )
  })
})

describe('ConfirmReminderReplace', () => {
  it('names the page, the rule being replaced, and the choice', () => {
    open()
    const dialog = screen.getByRole('dialog', { name: 'Replace reminder?' })
    expect(dialog.getAttribute('open')).not.toBeNull()
    expect(dialog.textContent).toContain('Take pills')
    expect(dialog.textContent).toContain('every day from October 6, 2026')
    expect(dialog.textContent).toContain('every week from October 20, 2026')
  })

  it('starts focus on Cancel so Enter cannot replace by accident', () => {
    open()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }))
  })

  it('reports Replace once and does not cancel', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    open(onConfirm, onCancel)
    fireEvent.click(screen.getByRole('button', { name: 'Replace' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('reports Escape and the Cancel control as the same cancellation', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    open(onConfirm, onCancel)

    fireEvent(screen.getByRole('dialog', { name: 'Replace reminder?' }), new Event('cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(2)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
