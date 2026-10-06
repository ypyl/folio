import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { TOUR_STEPS } from '../tour/steps'
import { placeCard, type Pos, type Rect } from '../tour/place'
import styles from './Tour.module.css'

// The app tour (add-app-tour): a modal overlay that walks the shell's regions in
// steps. It is App-owned and returns null while closed, like the search
// spotlight it borrows its contract from — a fixed scrim, an ivory card, focus
// into the card on open and back to the opener on close, Tab contained, and
// Escape to end. The step's region is found by selector and highlighted with a
// transparent cut-out whose spread shadow paints the wash around it; the card is
// placed beside the region and clamped to the viewport. Measuring runs only
// while the tour is open, so the closed app carries no listener and the typing
// path gains nothing.

/** The card's fixed width, matching `.card` in Tour.module.css. */
const CARD_W = 320

export function Tour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [pos, setPos] = useState<Pos | null>(null)
  const [prevOpen, setPrevOpen] = useState(open)

  // Each open starts at the first step. Adjusting during render (the pattern the
  // meta panel uses for its per-page collapse state) resets before the new step
  // shows, without a setState-in-effect round trip.
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setStep(0)
  }

  // The control that opened the tour takes focus back when it closes; the ref
  // write and the restore live in one effect, so cleanup runs exactly once.
  useEffect(() => {
    if (!open) return
    restoreRef.current = (document.activeElement as HTMLElement | null) ?? null
    return () => {
      restoreRef.current?.focus?.()
    }
  }, [open])

  // Move focus into the card on open and on each step, so the step is announced
  // and the keyboard starts inside the tour.
  useEffect(() => {
    if (!open) return
    cardRef.current?.focus()
  }, [open, step])

  // Measure the step's region and place the cut-out and card from it. Kept
  // measured while the region can move under a scroll or a resize; the listeners
  // exist only while the tour is open, so the closed app carries none. A region
  // that is not on screen clears the cut-out and centers the card, so the step
  // still explains itself.
  useLayoutEffect(() => {
    if (!open) return
    const measure = () => {
      const card = cardRef.current
      const w = card?.offsetWidth || CARD_W
      const h = card?.offsetHeight || 0
      const el = document.querySelector(TOUR_STEPS[step].target)
      if (el === null) {
        setRect(null)
        setPos({ top: (window.innerHeight - h) / 2, left: (window.innerWidth - w) / 2 })
        return
      }
      const r = el.getBoundingClientRect()
      const next = { top: r.top, left: r.left, width: r.width, height: r.height }
      setRect(next)
      setPos(placeCard(next, TOUR_STEPS[step].side, w, h))
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open, step])

  if (!open) return null

  const current = TOUR_STEPS[step]
  const last = step === TOUR_STEPS.length - 1

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    // Contain Tab within the card, so focus cannot reach the shell behind it.
    const card = cardRef.current
    if (card === null) return
    const focusables = card.querySelectorAll<HTMLElement>('button:not([disabled])')
    if (focusables.length === 0) return
    const first = focusables[0]
    const lastEl = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      lastEl.focus()
    } else if (!e.shiftKey && document.activeElement === lastEl) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <div className={styles.overlay}>
      {/* The cut-out: transparent, its spread shadow painting the wash around
          it. A missing region leaves it zero-sized, which washes the whole
          viewport with no visible hole. */}
      <div
        className={styles.hole}
        data-testid="tour-hole"
        aria-hidden="true"
        style={{
          top: rect?.top ?? 0,
          left: rect?.left ?? 0,
          width: rect?.width ?? 0,
          height: rect?.height ?? 0,
        }}
      />
      <div
        ref={cardRef}
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-label="App tour"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        style={pos ? { top: pos.top, left: pos.left } : undefined}
      >
        <p className={styles.progress}>{`Step ${step + 1} of ${TOUR_STEPS.length}`}</p>
        <p className={styles.title}>{current.title}</p>
        <p className={styles.body}>{current.body}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.skip} onClick={onClose}>
            Skip
          </button>
          <button
            type="button"
            className={`btn-secondary ${styles.back}`}
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </button>
          {last ? (
            <button type="button" className={styles.primary} onClick={onClose}>
              Done
            </button>
          ) : (
            <button
              type="button"
              className={styles.primary}
              onClick={() => setStep((s) => Math.min(TOUR_STEPS.length - 1, s + 1))}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
