import type { ImportProgress, ImportReport } from '../vault/logseqImport'
import styles from './LogseqImport.module.css'

// The brand-screen import surface (add-logseq-import, design D5): the button,
// the running progress, and the result summary. Presentational only — App owns
// the import state and the filesystem work.

export type ImportView =
  | { kind: 'running'; progress: ImportProgress }
  | { kind: 'done'; report: ImportReport }
  | { kind: 'error'; message: string }

const PHASE_LABEL: Record<ImportProgress['phase'], string> = {
  scanning: 'Reading the Logseq folder',
  writing: 'Writing the vault',
}

export function LogseqImportButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="btn-secondary" onClick={onClick}>
      Import from Logseq
    </button>
  )
}

export function LogseqImportPanel({
  view,
  onContinue,
}: {
  view: ImportView
  onContinue: () => void
}) {
  if (view.kind === 'running') {
    const { phase, done, total } = view.progress
    const percent = total === 0 ? 0 : Math.round((done / total) * 100)
    return (
      <main className={styles.pane} aria-busy="true">
        <div className={styles.panel}>
          <h2 className={styles.title}>Importing from Logseq</h2>
          <p className={styles.phase}>{PHASE_LABEL[phase]}</p>
          <div
            className={styles.track}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
            aria-label={PHASE_LABEL[phase]}
          >
            <div className={styles.fill} style={{ width: `${percent}%` }} />
          </div>
          <p className={styles.count} role="status" aria-live="polite">
            {done} of {total}
          </p>
        </div>
      </main>
    )
  }

  if (view.kind === 'error') {
    return (
      <main className={styles.pane}>
        <div className={styles.panel} role="alert">
          <h2 className={styles.title}>Import failed</h2>
          <p className={styles.phase}>{view.message}</p>
          <button type="button" className="btn-secondary" onClick={onContinue}>
            Dismiss
          </button>
        </div>
      </main>
    )
  }

  const { report } = view
  return (
    <main className={styles.pane}>
      <div className={styles.panel} role="status">
        <h2 className={styles.title}>Import complete</h2>
        <ul className={styles.summary}>
          <li>
            <span className={styles.figure}>{report.written}</span> files written
          </li>
          <li>
            <span className={styles.figure}>{report.merged}</span> merged into existing files
          </li>
          <li>
            <span className={styles.figure}>{report.assetsCopied}</span> assets copied
          </li>
          <li>
            <span className={styles.figure}>{report.skipped}</span> assets skipped (already in the
            destination)
          </li>
          <li>
            <span className={styles.figure}>{report.alreadyImported}</span> source files already
            imported
          </li>
        </ul>
        {report.collisions.length > 0 && (
          <p className={styles.phase}>
            {report.collisions.length} source names collided; the first was kept.
          </p>
        )}
        <button type="button" className="btn-primary" onClick={onContinue}>
          Continue
        </button>
      </div>
    </main>
  )
}
