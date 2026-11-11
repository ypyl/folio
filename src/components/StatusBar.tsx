import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { version } from '../../package.json'
import { recentChanges } from '../changelog'
import type { CompactView } from '../compact'
import type { DraftStatus } from '../editor/drafts'
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

// A pane glyph: a frame with the divider on the side the view occupies, so the
// navigation control and the meta control read as mirror images and each points
// at where its view comes from. The pane beside the divider is filled while that
// control's view is open, which is how the bar shows which view you are looking
// at by shape rather than by colour (mark-the-open-view-in-the-app-bar). The
// pane's outer corners are rounded to match the frame and the corners meeting
// the divider are square, so the fill reads as the pane rather than as a chip
// floating inside the frame. aria-hidden, like the chevron: the control's name
// carries the meaning and `aria-pressed` carries the state.
const PANE = {
  nav: { divider: 'M9 4v16', pane: 'M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4Z' },
  meta: { divider: 'M15 4v16', pane: 'M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4Z' },
} as const

function PanelsIcon({ side, open }: { side: 'nav' | 'meta'; open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles.viewIcon}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      {/* The fill follows the stroke's colour, so the open pane and its frame
          are one solid shape. Drawn before the divider so the divider's edge
          stays clean. */}
      {open && <path d={PANE[side].pane} fill="currentColor" stroke="none" />}
      <path d={PANE[side].divider} />
    </svg>
  )
}

// Save-state copy (moved from the pane's SaveIndicator, page-editing spec):
// muted text, never a badge.
const SAVE_LABELS: Record<Exclude<DraftStatus, 'clean'>, string> = {
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  failed: 'Save failed',
}

// The pin toggle's label stem was here; favoriting moved to the row's context
// menu (add-row-context-menu), so the bar no longer names a page for it.

// The running version (version-in-status-bar), now a disclosure
// (show-recent-changes-from-the-version-badge): the bar's trailing edge names
// the build, and activating it lists what that build carries. A disclosure, not
// a dialog — focus stays on the badge, so reading the list never takes the
// user's place in the document — and every ordinary way out (a second
// activation, a press outside, Escape, the window losing focus) closes it. The
// entries come from the bundled changelog, parsed once at module load, so
// opening the panel costs one render and nothing else. A build whose changelog
// parsed to nothing keeps the plain label: the bar never offers a control that
// opens an empty panel.
function VersionBadge() {
  const [open, setOpen] = useState(false)
  const group = useRef<HTMLDivElement>(null)
  const headingId = useId()
  const panelId = useId()

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
            {recentChanges.map((change) => (
              <li key={`${change.date} ${change.text}`} className={styles.change}>
                <span className={styles.changeText}>{change.text}</span>
                <time className={styles.changeDate} dateTime={change.date}>
                  {change.date}
                </time>
              </li>
            ))}
          </ul>
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
  compact = false,
  view,
  onShowView,
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
  /** The compact shell (add-compact-mobile-shell): the bar is its app bar, so
   *  it carries the two view controls and drops what a phone-width row cannot
   *  hold. Absent on a wide window, where the bar shows the open item's path and
   *  the folder's statistics. */
  compact?: boolean
  /** Which compact view is shown, for the controls' pressed state. */
  view?: CompactView
  /** Show a compact view, or return to the editor by activating the one shown. */
  onShowView?: (view: 'nav' | 'meta') => void
}) {
  const segments = pagePath?.split('/') ?? []
  const hasDirs = segments.length > 1
  // Indexing outranks save text while the index builds; otherwise the save
  // state shows, with a page that has no file yet reading as "new".
  const saveLabel =
    saveState === 'clean'
      ? null
      : saveState === 'dirty' && newPage
        ? 'New page: created on first save'
        : SAVE_LABELS[saveState]
  const statusText = indexing ? 'Indexing notes…' : saveLabel

  return (
    <footer
      data-tour="status"
      className={compact ? `${styles.bar} ${styles.compactBar}` : styles.bar}
    >
      {/* The compact shell's leading view control (add-compact-mobile-shell):
          the navigation unit — rail and sidebar together — which is where a
          first run lands, so this is the app bar's home control too. */}
      {compact && (
        <button
          type="button"
          className={styles.viewControl}
          aria-label="Navigation"
          aria-pressed={view === 'nav'}
          onClick={() => onShowView?.('nav')}
        >
          <PanelsIcon side="nav" open={view === 'nav'} />
        </button>
      )}
      {/* Session navigation lived here until move-nav-controls-to-the-sidebar
          moved Back, Forward, and Today into the sidebar's navigation row, so
          the bar can lead with the open item. */}
      <div className={styles.path} title={pagePath ?? undefined}>
        {/* The compact bar shows the open item's name alone: a 360px row has no
            space for the directories, and the name is what identifies it. */}
        {hasDirs && !compact && (
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
      {/* The compact shell's trailing view control: the meta panel, which owns
          the page's metadata. aria-pressed reports whether it is the view
          shown, the same "toggle whose pressed state is the view" pattern the
          leading control uses. */}
      {compact && (
        <button
          type="button"
          className={`${styles.viewControl} ${styles.viewControlTrailing}`}
          aria-label="Page details"
          aria-pressed={view === 'meta'}
          onClick={() => onShowView?.('meta')}
        >
          <PanelsIcon side="meta" open={view === 'meta'} />
        </button>
      )}
      {/* The vault group is the wide bar's, like the version below it: on
          compact it renders nothing, and rendering an empty box that also
          carried `margin-left: auto` split the free space with the meta
          control's own auto margin, so half the gap landed between them and
          the control sat short of the bar's trailing edge. */}
      {!compact && (
        <div className={styles.vault}>
          {vaultName !== undefined && noteCount !== undefined ? (
            <span className={styles.vaultStatus} title={`${vaultName} (${noteCount} notes)`}>
              <span className={styles.vaultName}>{vaultName}</span>
              <span className={styles.vaultCount}>· {noteCount}</span>
            </span>
          ) : null}
        </div>
      )}
      {/* The running version beside the vault's note count. A sibling of the
          vault group rather than a child, so the group stays empty when no
          folder is active. */}
      {!compact && <VersionBadge />}
    </footer>
  )
}
