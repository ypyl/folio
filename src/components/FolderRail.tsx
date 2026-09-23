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
  onActivate,
  onClose,
}: FolderRailProps) {
  return (
    <nav className={styles.rail} aria-label="Open folders">
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
    </nav>
  )
}
