import { useEffect, useRef } from 'react'
import type { Recurrence } from '../vault/reminders'
import { describeSchedule } from './recurrences'
import styles from './ConfirmReminderReplace.module.css'

/**
 * The replacement confirmation (confirm-replacing-a-reminder): a page has one
 * reminder, so choosing another schedule deletes the one it had. The native
 * `<dialog>` gives the top layer, focus containment, and Escape (the search
 * spotlight's modal pattern); this component adds the copy, the two controls, and
 * the rule that focus starts on `Cancel` so a stray Enter cannot overwrite the
 * existing schedule.
 */
export function ConfirmReminderReplace({
  page,
  from,
  to,
  onCancel,
  onConfirm,
}: {
  /** The reminded page's name. */
  page: string
  /** The rule the replacement would delete. */
  from: { recurrence: Recurrence; anchor: string }
  /** The rule being chosen. */
  to: { recurrence: Recurrence; anchor: string }
  onCancel: () => void
  onConfirm: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    // jsdom has no modal API; the browser does, and the copy is what matters in
    // a test (the search spotlight's precedent).
    if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal()
    cancelRef.current?.focus()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label="Replace reminder?"
      // Escape is a dismissal, not a close with a side effect: report it as the
      // user's cancel and let the owner unmount the dialog.
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
    >
      <p className={styles.title}>Replace reminder?</p>
      <p className={styles.body}>
        {page} already has a reminder: {describeSchedule(from)}. Replacing it with{' '}
        {describeSchedule(to)} discards the current schedule.
      </p>
      <div className={styles.actions}>
        <button
          ref={cancelRef}
          type="button"
          className={`btn-secondary ${styles.cancel}`}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button type="button" className={styles.replace} onClick={onConfirm}>
          Replace
        </button>
      </div>
    </dialog>
  )
}
