import styles from './FolderRail.module.css'
import type { VaultFolder, VaultStatus } from '../vault/useVault'

interface FolderRailProps {
  status: VaultStatus
  folders: VaultFolder[]
  activeId: string | null
  onAdd: () => void
  onActivate: (id: string) => void
  onClose: (id: string) => void
}

// The leading 56px column of opened folders (D3): an add control at the top,
// one avatar per folder below. Avatar = first letter on a warm surface; the
// active folder gets a brand ring, a pending-permission folder a hollow
// (dashed) ring. Kami palette only — the rail must not introduce a second
// chromatic color (ui-shell spec).
export function FolderRail({ status, folders, activeId, onAdd, onActivate, onClose }: FolderRailProps) {
  if (status === 'restoring') return <nav className={styles.rail} aria-label="Open folders" />
  return (
    <nav className={styles.rail} aria-label="Open folders">
      <button type="button" className={styles.add} onClick={onAdd} title="Add folder" aria-label="Add folder">
        <span aria-hidden="true">+</span>
      </button>
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
    </nav>
  )
}