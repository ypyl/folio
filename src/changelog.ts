// The build's recent changes (show-recent-changes-from-the-version-badge,
// group-the-changelog-by-version, workspace spec). CHANGELOG.md is generated
// from the commit history and committed, so the bundle carries it as text and
// the app needs no git, no network, and no vault file to say what changed. One
// parse at module load; the status bar's panel renders a slice of the result.
import source from '../CHANGELOG.md?raw'

/** One version's user-facing changes, newest first in the file. */
export type ChangeGroup = {
  /** The version the entry's commit carried, without its `v` prefix. */
  version: string
  /** The day the group's newest change landed, `YYYY-MM-DD`. */
  date: string
  /** The changes' texts, the commit subjects without their type prefix. */
  texts: string[]
}

/** How many changes the panel shows. The file keeps more, so this can grow
 *  without regenerating it. A group is never split across the cap. */
const RECENT_CHANGES_SHOWN = 20

const VERSION_HEADING = /^##\s+v(\d+\.\d+\.\d+)\s+\((\d{4}-\d{2}-\d{2})\)\s*$/
const BULLET = /^-\s+(.+)$/

/** Read the version groups and their bullets, newest first as the file writes
 *  them. Anything else — the header, blank lines, a bullet before the first
 *  heading, a heading with no bullets — contributes nothing, so a hand-edited
 *  file degrades instead of throwing. */
export function parseChangelog(text: string): ChangeGroup[] {
  const groups: ChangeGroup[] = []
  let current: ChangeGroup | null = null
  // Split on CRLF too: the file is generated on Windows as often as not.
  for (const line of text.split(/\r?\n/)) {
    const heading = VERSION_HEADING.exec(line)
    if (heading) {
      current = { version: heading[1], date: heading[2], texts: [] }
      groups.push(current)
      continue
    }
    if (current === null) continue
    const bullet = BULLET.exec(line)
    if (bullet) current.texts.push(bullet[1].trim())
  }
  return groups.filter((group) => group.texts.length > 0)
}

/** The newest `limit` changes, keeping each version's group whole. */
function take(groups: readonly ChangeGroup[], limit: number): ChangeGroup[] {
  const shown: ChangeGroup[] = []
  let count = 0
  for (const group of groups) {
    if (count >= limit) break
    const texts = group.texts.slice(0, limit - count)
    if (texts.length > 0) shown.push({ ...group, texts })
    count += texts.length
  }
  return shown
}

/** What the version badge's panel lists: the newest groups the build carries. */
export const recentChanges: readonly ChangeGroup[] = take(
  parseChangelog(source),
  RECENT_CHANGES_SHOWN,
)
