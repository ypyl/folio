import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { version } from '../../package.json'
import { recentChanges } from '../changelog'
import type { ActivityEntry } from '../agent/activity'
import type { DraftStatus } from '../editor/drafts'
import { saveStateLabel } from './saveLabel'
import styles from './StatusBar.module.css'

// App-level status frame (add-status-bar, ui-shell spec): one always-present
// thin bar below the workspace showing the open page's file path, the
// save/indexing status, and the active vault's name and note count (right). The
// bar sits outside all pane scroll regions, so its content never scrolls. Groups
// empty when their content has no source. The open item's name is its only
// control: a page's name reveals its row in the Files listing
// (reveal-open-page-in-files) and a journal day's locates the day in the Journal
// calendar (focus-the-journal-day-in-the-calendar). Either name spells the file
// name the crumb prints, so what is written on it is what a person says to
// activate it (name-the-crumb-with-what-it-shows), while the directory crumbs
// and the other groups stay display-only. The question-mark help button and its
// modal lived here until move-help-to-right-panel moved the reference into the
// right panel, the pin star lived here until add-row-context-menu moved
// favoriting to a page row's context menu, and Back, Forward, and Today lived
// here until move-nav-controls-to-the-sidebar moved them onto the sidebar's
// JOURNAL row.

// The pin toggle's label stem was here; favoriting moved to the row's context
// menu (add-row-context-menu), so the bar no longer names a page for it.

// The disclosure behaviour both of the bar's trailing controls share
// (show-recent-changes-from-the-version-badge, add-agent-activity-log): open on
// activation, and close on every ordinary way out, a second activation, a press
// outside, Escape, or the window losing focus. Focus stays on the control, so
// reading either panel never takes the user's place in the document.
function useDisclosure() {
  const [open, setOpen] = useState(false)
  const group = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onPointerDown = (event: Event) => {
      if (!group.current?.contains(event.target as Node)) close()
    }
    // Escape is read on the document so it works wherever focus went, and in
    // the capture phase because the editor may stop it from bubbling. It does
    // not stop the key itself: a surface that also claims Escape still gets it.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('blur', close)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('blur', close)
    }
  }, [open])

  return { open, setOpen, group }
}

/** A time of day as the record prints it (`14:02`), local, so a row reads as
 *  "when" without a locale-dependent format a test cannot pin. */
function timeText(at: number): string {
  const date = new Date(at)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// The running version (version-in-status-bar), now a disclosure
// (show-recent-changes-from-the-version-badge): the bar's trailing edge names
// the build, and activating it lists what that build carries. The entries come
// from the bundled changelog, parsed once at module load, so opening the panel
// costs one render and nothing else. A build whose changelog parsed to nothing
// keeps the plain label: the bar never offers a control that opens an empty
// panel.
function VersionBadge() {
  const { open, setOpen, group } = useDisclosure()
  const headingId = useId()
  const panelId = useId()

  const label = `v${version}`
  if (recentChanges.length === 0) return <span className={styles.version}>{label}</span>

  return (
    <div className={styles.versionGroup} ref={group}>
      <button
        type="button"
        className={styles.version}
        aria-label={`${label}, show the recent changes`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((shown) => !shown)}
      >
        {label}
      </button>
      {open && (
        // A named group rather than a bare box: the heading names the panel in
        // the accessibility tree, and a test can ask for it by that name.
        <div className={styles.changes} id={panelId} role="group" aria-labelledby={headingId}>
          <p className={styles.changesHeading} id={headingId}>
            Recent changes
          </p>
          <ul className={styles.changesList}>
            {recentChanges.map((group) => (
              <li key={`${group.version} ${group.date}`} className={styles.changeGroup}>
                <p className={styles.changeVersion}>
                  <span>v{group.version}</span>
                  <time className={styles.changeDate} dateTime={group.date}>
                    {group.date}
                  </time>
                </p>
                <ul className={styles.changeTexts}>
                  {group.texts.map((text) => (
                    <li key={text} className={styles.change}>
                      <span className={styles.changeText}>{text}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// The session's record of what an agent did on the user's behalf
// (add-agent-activity-log): the bar's other disclosure, beside the version. It
// renders only where the app supplies the record, which it does only while the
// agent gate is on, so a build with the gate off draws no control at all. Each
// row names the action, the path, and the time, and activating one opens the
// page it names; the record itself is review-only (ADR-0036), so a row offers
// nothing else.
function ActivityBadge({
  entries,
  onOpen,
}: {
  entries: readonly ActivityEntry[]
  onOpen: (path: string) => void
}) {
  const { open, setOpen, group } = useDisclosure()
  const headingId = useId()
  const panelId = useId()
  const label = `agent: ${entries.length}`

  return (
    <div className={styles.activityGroup} ref={group}>
      <button
        type="button"
        className={styles.activity}
        aria-label={`${label}, show what the agent did`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((shown) => !shown)}
      >
        {label}
      </button>
      {open && (
        <div className={styles.activityPanel} id={panelId} role="group" aria-labelledby={headingId}>
          <p className={styles.changesHeading} id={headingId}>
            Agent activity
          </p>
          {entries.length === 0 ? (
            <p className={styles.activityEmpty}>No agent actions this session.</p>
          ) : (
            <ul className={styles.changesList}>
              {entries.map((entry) => (
                <li key={`${entry.at} ${entry.tool} ${entry.path}`} className={styles.activityRow}>
                  <button
                    type="button"
                    className={styles.activityRowButton}
                    onClick={() => onOpen(entry.path)}
                  >
                    <span className={styles.activityTool}>{entry.tool}</span>
                    <span className={styles.activityPath}>{entry.path}</span>
                    <span className={styles.activityMeta}>
                      <span>
                        +{entry.added} −{entry.removed}
                      </span>
                      <time dateTime={new Date(entry.at).toISOString()}>{timeText(entry.at)}</time>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export function StatusBar({
  pagePath,
  saveState = 'clean',
  newPage = false,
  indexing = false,
  vaultName,
  noteCount,
  onRevealPage,
  onLocateDay,
  activity,
  onOpenActivityPath,
}: {
  /** The open page's vault-relative path, or null when no page is open. */
  pagePath: string | null
  saveState?: DraftStatus
  /** The open page has no file yet; its first save creates it. */
  newPage?: boolean
  /** The active folder's index is building (indexing-loading-state). */
  indexing?: boolean
  vaultName?: string
  /** How many notes the active folder holds (the index's page count, or the
   *  folder's own count by the same rule while the index builds). */
  noteCount?: number
  /** Reveal the open page's row in the sidebar's Files listing
   *  (reveal-open-page-in-files). App supplies it for a page; a page with no file
   *  yet is created by the reveal so it can have a row
   *  (reveal-a-page-that-has-no-file). A board, an asset, and a journal day keep
   *  inert text, which is what the absence of this prop means. */
  onRevealPage?: () => void
  /** Locate the open journal day in the Journal calendar
   *  (focus-the-journal-day-in-the-calendar): shows the left navigation and the
   *  Journal section, moves the calendar to the day's month, and places focus on
   *  the day's cell. App supplies it for a journal day and omits it otherwise, so
   *  a page's crumb and a day's are never both controls. */
  onLocateDay?: () => void
  /** The session's agent record (add-agent-activity-log). Absent while the agent
   *  gate is off, which is what keeps the control off the bar: the app supplies
   *  it only with the gate on. */
  activity?: readonly ActivityEntry[]
  /** Open the page an activity row names. */
  onOpenActivityPath?: (path: string) => void
}) {
  const segments = pagePath?.split('/') ?? []
  const hasDirs = segments.length > 1
  // One copy for this bar and the compact app bar (give-the-phone-a-navigation-
  // bar): indexing outranks the save state, and a page with no file reads as a
  // new page.
  const statusText = saveStateLabel({ saveState, newPage, indexing })

  return (
    <footer data-tour="status" className={styles.bar}>
      {/* Session navigation lived here until move-nav-controls-to-the-sidebar
          moved Back, Forward, and Today into the sidebar's navigation row, so
          the bar can lead with the open item. The compact footer is the
          navigation bar now; this one renders only above the breakpoint. */}
      <div className={styles.path} title={pagePath ?? undefined}>
        {hasDirs && (
          <>
            <span className={styles.crumbDirs}>
              {segments.slice(0, -1).map((segment, i) => (
                <Fragment key={`${i}-${segment}`}>
                  {i > 0 && (
                    <span className={styles.crumbSep} aria-hidden="true">
                      /
                    </span>
                  )}
                  {segment}
                </Fragment>
              ))}
            </span>
            <span className={styles.crumbSep} aria-hidden="true">
              /
            </span>
          </>
        )}
        {segments.length > 0 &&
          (onRevealPage || onLocateDay ? (
            // The open item's name is the bar's one non-navigation control: a
            // page's reveals its row in Files and does nothing else
            // (reveal-open-page-in-files); a journal day's locates the day in
            // the calendar and does nothing else
            // (focus-the-journal-day-in-the-calendar). Either name carries the
            // text the crumb prints, so what is on screen is what is said to
            // activate it (name-the-crumb-with-what-it-shows).
            <button
              type="button"
              className={`${styles.crumbLast} ${styles.crumbReveal}`}
              aria-label={
                onLocateDay
                  ? `Show ${segments[segments.length - 1]} in the Journal calendar`
                  : `Reveal ${segments[segments.length - 1]} in Files`
              }
              onClick={onLocateDay ?? onRevealPage}
            >
              {segments[segments.length - 1]}
            </button>
          ) : (
            <span className={styles.crumbLast}>{segments[segments.length - 1]}</span>
          ))}
      </div>
      <div className={styles.center}>
        {statusText !== null ? (
          <span className={styles.statusText} role="status">
            {statusText}
          </span>
        ) : null}
      </div>
      <div className={styles.vault}>
        {vaultName !== undefined && noteCount !== undefined ? (
          <span className={styles.vaultStatus} title={`${vaultName} (${noteCount} notes)`}>
            <span className={styles.vaultName}>{vaultName}</span>
            <span className={styles.vaultCount}>· {noteCount}</span>
          </span>
        ) : null}
      </div>
      {/* The running version beside the vault's note count. A sibling of the
          vault group rather than a child, so the group stays empty when no
          folder is active. The agent's record sits beside it while the gate is
          on (add-agent-activity-log), so the bar's trailing edge holds the
          build's identity and what was done to the vault in this session. */}
      {activity !== undefined && onOpenActivityPath !== undefined && (
        <ActivityBadge entries={activity} onOpen={onOpenActivityPath} />
      )}
      <VersionBadge />
    </footer>
  )
}
