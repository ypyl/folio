// The presentation surface (add-presentations, design D2/D4/D5/D6). A modal
// <dialog> over the whole workspace, showing one slide of static HTML at a
// time. It is view-only: it renders the deck App derived from the page, self-
// contained and side-effect free, and closing is a state flip in App, so the
// editor underneath returns exactly as it was. The dialog is the app's own
// (no slide library); its HTML came from the app's serialized document, so it
// is inserted directly.

import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  createAssetImages,
  releaseAssetImages,
  syncAssetImages,
  type AssetImages,
} from '../editor/assetImages'
import styles from './PresentationView.module.css'

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
    </svg>
  )
}

export function PresentationView({
  slides,
  onClose,
  readAsset,
}: {
  /** The deck, derived once by App from the page's blocks (design D3/D5). */
  slides: string[]
  /** Leave the presentation; App clears its state, which unmounts this. */
  onClose: () => void
  /** Read a vault file's bytes so a slide image can render (design D4). */
  readAsset?: (path: string) => Promise<Blob>
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const slideRef = useRef<HTMLDivElement>(null)
  const imagesRef = useRef<AssetImages | null>(null)
  const [index, setIndex] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  const count = slides.length
  const current = Math.min(index, count - 1)

  // Open the dialog on mount and release its image URLs on the way out. The
  // deck is captured by App before this mounts, so nothing here reads the page.
  useEffect(() => {
    const dialog = dialogRef.current
    const cache = createAssetImages()
    imagesRef.current = cache
    if (dialog && typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal()
    return () => {
      releaseAssetImages(cache)
      imagesRef.current = null
      if (dialog?.open && typeof dialog.close === 'function') dialog.close()
    }
  }, [])

  // Point the shown slide's vault images at their bytes (design D4). Re-running
  // is free: resolved paths cost one map lookup in the shared cache.
  useEffect(() => {
    const host = slideRef.current
    const cache = imagesRef.current
    if (!host || !cache || !readAsset) return
    syncAssetImages(host, cache, readAsset)
  }, [current, readAsset])

  // Fullscreen is a view state of the dialog, never of the page (design D6).
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === dialogRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, count - 1)), [count])
  const previous = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), [])
  const toggleFullscreen = useCallback(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    try {
      if (document.fullscreenElement === dialog) {
        void document.exitFullscreen?.()
      } else {
        const requested = dialog.requestFullscreen?.()
        if (requested && typeof requested.catch === 'function') requested.catch(() => {})
      }
    } catch {
      // A browser that refuses fullscreen leaves the deck usable (spec).
    }
  }, [])

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDialogElement>) => {
    const key = event.key
    // Space on a control is that control's activation, not a slide step.
    if ((key === ' ' || key === 'Space') && (event.target as HTMLElement).tagName === 'BUTTON') {
      return
    }
    switch (key) {
      case 'ArrowRight':
      case ' ':
      case 'Space':
      case 'PageDown':
      case 'ArrowDown':
        event.preventDefault()
        next()
        break
      case 'ArrowLeft':
      case 'PageUp':
      case 'ArrowUp':
        event.preventDefault()
        previous()
        break
      case 'Home':
        event.preventDefault()
        setIndex(0)
        break
      case 'End':
        event.preventDefault()
        setIndex(count - 1)
        break
      case 'f':
      case 'F':
        event.preventDefault()
        toggleFullscreen()
        break
      default:
        break
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label="Presentation"
      onKeyDown={onKeyDown}
      onCancel={(event) => {
        event.preventDefault()
        // While fullscreen, Escape leaves fullscreen first and only the next
        // Escape closes the deck (design D6). The browser may deliver cancel on
        // that first press, so ignore it until fullscreen is left.
        if (document.fullscreenElement === dialogRef.current) return
        onClose()
      }}
    >
      <div className={styles.deck}>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.tool}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={fullscreen ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}
            onClick={toggleFullscreen}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.tool}
            aria-label="Close presentation"
            title="Close (Esc)"
            onClick={onClose}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div
          ref={slideRef}
          className={styles.slide}
          // The HTML is the app's own serialized document (design D5).
          dangerouslySetInnerHTML={{ __html: slides[current] ?? '' }}
        />
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navButton}
            aria-label="Previous slide"
            disabled={current === 0}
            onClick={previous}
          >
            <Chevron dir="left" />
          </button>
          <div className={styles.status}>
            <span className={styles.position}>{`${current + 1} / ${count}`}</span>
            <div
              className={styles.bar}
              role="progressbar"
              aria-label="Slide progress"
              aria-valuemin={1}
              aria-valuemax={count}
              aria-valuenow={current + 1}
            >
              <span
                className={styles.barFill}
                style={{ width: `${((current + 1) / count) * 100}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            className={styles.navButton}
            aria-label="Next slide"
            disabled={current === count - 1}
            onClick={next}
          >
            <Chevron dir="right" />
          </button>
        </div>
      </div>
    </dialog>
  )
}
