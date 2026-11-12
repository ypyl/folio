// Regenerate CHANGELOG.md from the commit history
// (show-recent-changes-from-the-version-badge, group-the-changelog-by-version).
// The status bar's version badge reads the committed file at build time, so the
// bundle carries it without git: run this whenever the history gains a
// user-facing commit, and commit the result.
//
// Only `feat:` and `fix:` subjects are user-facing. `chore:`, `docs:`, and
// `test:` commits describe the repository, not the app, so the badge never
// names them. Each entry is grouped under the version its commit carried, read
// from that commit's package.json rather than the working tree's current bump.

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Entries the file keeps. The panel shows a slice of them. */
const LIMIT = 40
/** A conventional-commit subject, with its type and optional scope stripped. */
const USER_FACING = /^(?:feat|fix)(?:\([^)]*\))?!?:\s*(.+)$/
/** A plain semver the heading and the app's parser both accept. */
const VERSION = /^\d+\.\d+\.\d+$/

const HEADER = `# Changelog

What changed in Folio, newest first, grouped by the version that shipped it.
Generated from the commit history by \`npm run changelog\`, so an entry exists for
every \`feat:\` and \`fix:\` commit and for nothing else. The status bar's version
badge reads this file.
`

function commits() {
  // `%ad` is the author date, which is the day the change landed in the
  // history the app is built from. `%H` names the commit whose package.json
  // carries the version this entry belongs to.
  const out = execFileSync('git', ['log', '--pretty=format:%H%x09%ad%x09%s', '--date=short'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  return out
    .split('\n')
    .map((line) => {
      const [hash, date, ...subject] = line.split('\t')
      const match = USER_FACING.exec(subject.join('\t'))
      return hash && date && match ? { hash, date, text: match[1].trim() } : null
    })
    .filter((entry) => entry !== null)
}

/** The version a commit carried. A user-facing commit without one is a broken
 *  invariant, so say so with the commit rather than inventing a heading. */
function commitVersion(hash) {
  let raw
  try {
    raw = execFileSync('git', ['show', `${hash}:package.json`], { encoding: 'utf8' })
  } catch {
    throw new Error(`changelog — no package.json at ${hash.slice(0, 7)}; cannot name its version`)
  }
  let version
  try {
    version = JSON.parse(raw).version
  } catch {
    throw new Error(`changelog — package.json at ${hash.slice(0, 7)} is not JSON`)
  }
  if (typeof version !== 'string' || !VERSION.test(version))
    throw new Error(`changelog — package.json at ${hash.slice(0, 7)} has no plain semver version`)
  return version
}

/** Group kept entries by version, newest first. Consecutive entries with the
 *  same version share one heading; the heading carries the newest date. */
function byVersion(entries) {
  const grouped = []
  for (const entry of entries) {
    const group = grouped[grouped.length - 1]
    if (group && group.version === entry.version) group.texts.push(entry.text)
    else grouped.push({ version: entry.version, date: entry.date, texts: [entry.text] })
  }
  return grouped
}

const entries = commits()
const kept = entries.slice(0, LIMIT).map((entry) => ({ ...entry, version: commitVersion(entry.hash) }))
const body = byVersion(kept)
  .map((group) => `## v${group.version} (${group.date})\n\n${group.texts.map((text) => `- ${text}`).join('\n')}`)
  .join('\n\n')

const file = join(process.cwd(), 'CHANGELOG.md')
writeFileSync(file, `${HEADER}\n${body}\n`)
console.log(
  `changelog — ${entries.length} entries in ${byVersion(kept).length} versions, newest ${entries[0]?.date ?? 'none'} -> CHANGELOG.md`,
)
