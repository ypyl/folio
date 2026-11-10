import { useId, useRef, useState } from 'react'
import { FolioMark } from '../FolioMark'
import styles from './FolderRail.module.css'
import type { ExperimentalFeature } from '../features'
import type { VaultFolder, VaultStatus } from '../vault/useVault'

interface FolderRailProps {
  status: VaultStatus
  folders: VaultFolder[]
  activeId: string | null
  /** Home control (ui-shell: the brand returns to the empty state). */
  onHome: () => void
  /** Opens the search spotlight (ui-shell: the rail hosts the search trigger). */
  onSearch: () => void
  /** The search trigger is unusable without a ready vault (search: scoped). */
  searchDisabled?: boolean
  /** Absent where the browser has no local-folder picker
   *  (warn-unsupported-browser): the rail then shows no add control. */
  onAdd?: () => void
  /** Opens the app tour (add-app-tour). App supplies it only on wide
   *  viewports, where the tour is available, so the control is absent on the
   *  compact shell — the same optional-callback shape `onAdd` uses. */
  onTour?: () => void
  /** The experimental switch, and the control that flips it (prerelease).
   *  Absent means the control is not offered. */
  prerelease?: boolean
  onTogglePrerelease?: () => void
  /** What the switch turns on, as the control's popup lists it
   *  (explain-the-experimental-switch): passed in, so the rail renders the
   *  flags module's own descriptions instead of keeping a second list. */
  experimental?: readonly ExperimentalFeature[]
  /** The whole left navigation is folded (collapse-rail-with-sidebar): the rail
   *  keeps its grid slot via `visibility: hidden` and leaves the tab order, the
   *  same way the sidebar does. */
  collapsed?: boolean
  onActivate: (id: string) => void
  onClose: (id: string) => void
}

// The leading 56px column of opened folders (D3): the brand home control and
// the search trigger lead it (replace-header-with-spotlight), then the add
// control, then one avatar per folder. Avatar = first letter on a warm surface;
// the active folder gets a brand ring, a pending-permission folder a hollow
// (dashed) ring. Kami palette only — the rail must not introduce a second
// chromatic color (ui-shell spec). The brand and search trigger render in every
// state, including while stored folders restore; the add control renders only
// where the browser can open a folder at all (warn-unsupported-browser), the
// same optional-callback shape the status bar's pin uses. The column itself
// always renders so the workspace grid keeps its leading column. The bottom
// group holds the experimental switch before the tour control, which stays the
// rail's last control (prerelease); hovering or focusing the switch describes
// what it turns on (explain-the-experimental-switch).
export function FolderRail({
  status,
  folders,
  activeId,
  onHome,
  onSearch,
  searchDisabled = false,
  onAdd,
  onTour,
  prerelease = false,
  onTogglePrerelease,
  experimental = [],
  collapsed = false,
  onActivate,
  onClose,
}: FolderRailProps) {
  const railRef = useRef<HTMLElement>(null)
  const prereleaseRef = useRef<HTMLButtonElement>(null)
  const tipId = useId()
  // The popup's anchor, set while it is shown (explain-the-experimental-switch,
  // design D3). `fixed` from the control's own box is what escapes the rail's
  // scroll box without a portal: no ancestor here is transformed.
  const [tip, setTip] = useState<{ left: number; bottom: number } | null>(null)

  const showTip = () => {
    const control = prereleaseRef.current
    const rail = railRef.current
    if (!control || !rail || experimental.length === 0) return
    const box = control.getBoundingClientRect()
    setTip({
      left: rail.getBoundingClientRect().right + 8,
      bottom: window.innerHeight - box.bottom,
    })
  }
  const hideTip = () => setTip(null)

  return (
    <nav
      ref={railRef}
      id="folder-rail"
      className={collapsed ? `${styles.rail} ${styles.collapsed}` : styles.rail}
      aria-label="Open folders"
    >
      <button
        type="button"
        className={styles.brand}
        onClick={onHome}
        title="Go home"
        aria-label="Folio, go home"
      >
        <FolioMark className={styles.mark} />
      </button>
      <button
        type="button"
        className={styles.search}
        onClick={onSearch}
        disabled={searchDisabled}
        title="Search notes"
        aria-label="Open search"
      >
        <svg
          viewBox="0 0 24 24"
          className={styles.searchIcon}
          role="presentation"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
      </button>
      {/* Entries resolve only after stored folders restore (ui-shell spec). */}
      {status !== 'restoring' && (
        <>
          {onAdd && (
            <button
              type="button"
              className={styles.add}
              onClick={onAdd}
              title="Add folder"
              aria-label="Add folder"
            >
              <span aria-hidden="true">+</span>
            </button>
          )}
          <div className={styles.list}>
            {folders.map((folder) => {
              const active = folder.id === activeId
              const pending = folder.permission !== 'granted'
              return (
                <div key={folder.id} className={styles.entry}>
                  <button
                    type="button"
                    className={`${styles.avatar}${active ? ` ${styles.active}` : ''}${pending ? ` ${styles.pending}` : ''}`}
                    onClick={() => onActivate(folder.id)}
                    title={folder.demo ? 'Open the demo vault' : folder.name}
                    aria-label={folder.demo ? 'Open the demo vault' : `Open folder ${folder.name}`}
                    aria-current={active ? 'page' : undefined}
                    data-demo={folder.demo || undefined}
                  >
                    <span className={styles.letter} aria-hidden="true">
                      {(folder.name || '?').charAt(0).toUpperCase()}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.close}
                    onClick={() => onClose(folder.id)}
                    title={`Close folder ${folder.name}`}
                    aria-label={`Close folder ${folder.name}`}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
      {/* The rail's bottom group (add-prerelease-mode): the experimental
          switch and the app tour's entry point, held to the bottom edge however
          many folders are listed. The tour stays the last control. */}
      <div className={styles.railBottom}>
        {onTogglePrerelease && (
          <button
            ref={prereleaseRef}
            type="button"
            className={styles.prerelease}
            onClick={onTogglePrerelease}
            onMouseEnter={showTip}
            onMouseLeave={hideTip}
            onFocus={showTip}
            onBlur={hideTip}
            aria-pressed={prerelease}
            aria-describedby={tip === null ? undefined : tipId}
            aria-label="Experimental features"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className={styles.prereleaseIcon}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" />
              <path d="M7 15h10" />
            </svg>
          </button>
        )}
        {/* The descriptions the switch turns on, while it is hovered or focused.
            A tooltip, not a menu: it takes no pointer input, so a press still
            lands on the control (design D4). */}
        {tip !== null && (
          <div
            id={tipId}
            role="tooltip"
            className={styles.prereleaseTip}
            style={{ left: tip.left, bottom: tip.bottom }}
          >
            <ul className={styles.tipList}>
              {experimental.map((feature) => (
                <li key={feature.flag} className={styles.tipRow}>
                  <span className={styles.tipLabel}>{feature.label}</span>
                  <span className={styles.tipDetail}>{feature.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {onTour && (
          <button
            type="button"
            className={styles.tour}
            onClick={onTour}
            title="Take the tour"
            aria-label="Take the tour"
          >
            <span aria-hidden="true">?</span>
          </button>
        )}
      </div>
    </nav>
  )
}
