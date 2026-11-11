import type { CompactView } from '../compact'
import styles from './CompactNavBar.module.css'

// The compact navigation bar (give-the-phone-a-navigation-bar, design D1): the
// phone's footer, three equal destinations at the Material navigation bar's
// anatomy (64px tall, 24px icon, 12px label, 56x32 active indicator). It is
// rendered only at the compact breakpoint; the wide shell keeps its status bar
// and its three panes.

const DESTINATIONS: Array<{ view: CompactView; label: string }> = [
  { view: 'nav', label: 'Notes' },
  { view: 'editor', label: 'Page' },
  { view: 'meta', label: 'Details' },
]

function NotesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <path
        d="M4 6h16M4 12h16M4 18h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <path
        d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DetailsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M15 4v16" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function CompactNavBar({
  view,
  onSelect,
}: {
  /** The view currently shown, which marks its destination. */
  view: CompactView
  /** Select a destination's view. The shown one is a no-op for the caller. */
  onSelect: (view: CompactView) => void
}) {
  return (
    <footer data-tour="status" className={styles.bar}>
      <nav className={styles.nav} aria-label="Views">
        {DESTINATIONS.map((destination) => {
          const active = view === destination.view
          return (
            <button
              key={destination.view}
              type="button"
              className={styles.destination}
              aria-current={active ? 'page' : undefined}
              onClick={() => onSelect(destination.view)}
            >
              <span className={active ? `${styles.indicator} ${styles.active}` : styles.indicator}>
                {destination.view === 'nav' ? (
                  <NotesIcon />
                ) : destination.view === 'editor' ? (
                  <PageIcon />
                ) : (
                  <DetailsIcon />
                )}
              </span>
              <span className={styles.label}>{destination.label}</span>
            </button>
          )
        })}
      </nav>
    </footer>
  )
}
