// The build's recent changes (show-recent-changes-from-the-version-badge,
// workspace spec). CHANGELOG.md is generated from the commit history and
// committed, so the bundle carries it as text and the app needs no git, no
// network, and no vault file to say what changed. One parse at module load;
// the status bar's panel renders a slice of the result.
import source from '../CHANGELOG.md?raw'

/** One user-facing change that landed in this build. */
export type Change = {
  /** The day it landed, `YYYY-MM-DD` as the file writes it. */
  date: string
  /** The change's text, the commit subject without its type prefix. */
  text: string
}

/** How many entries the panel shows. The file keeps more, so this can grow
 *  without regenerating it. */
const RECENT_CHANGES_SHOWN = 20

const DATE_HEADING = /^##\s+(\d{4}-\d{2}-\d{2})\s*$/
const BULLET = /^-\s+(.+)$/

/** Read the date groups and their bullets, newest first as the file writes
 *  them. Anything else — the header, blank lines, a bullet before the first
 *  date — contributes nothing, so a hand-edited file degrades instead of
 *  throwing. */
export function parseChangelog(text: string): Change[] {
  const changes: Change[] = []
  let date: string | null = null
  // Split on CRLF too: the file is generated on Windows as often as not.
  for (const line of text.split(/\r?\n/)) {
    const heading = DATE_HEADING.exec(line)
    if (heading) {
      date = heading[1]
      continue
    }
    if (date === null) continue
    const bullet = BULLET.exec(line)
    if (bullet) changes.push({ date, text: bullet[1].trim() })
  }
  return changes
}

/** What the version badge's panel lists: the newest changes the build carries. */
export const recentChanges: readonly Change[] = parseChangelog(source).slice(
  0,
  RECENT_CHANGES_SHOWN,
)
