import { FolioMark } from '../FolioMark'
import styles from './FolderRail.module.css'
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
  /** Prerelease mode, and the control that flips it (add-prerelease-mode).
   *  Absent means the control is not offered. */
  prerelease?: boolean
  onTogglePrerelease?: () => void
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
// always renders so the workspace grid keeps its leading column.
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
  collapsed = false,
  onActivate,
  onClose,
}: FolderRailProps) {
  return (
    <nav
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
                    title={folder.name}
                    aria-label={`Open folder ${folder.name}`}
                    aria-current={active ? 'page' : undefined}
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
      {/* The rail's bottom group (add-prerelease-mode): the prerelease toggle
          and the app tour's entry point, held to the bottom edge however many
          folders are listed. The tour stays the last control. */}
      <div className={styles.railBottom}>
        {onTogglePrerelease && (
          <button
            type="button"
            className={styles.prerelease}
            onClick={onTogglePrerelease}
            aria-pressed={prerelease}
            title={prerelease ? 'Prerelease features on' : 'Prerelease features off'}
            aria-label="Prerelease features"
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
