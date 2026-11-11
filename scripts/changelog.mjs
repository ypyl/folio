// Regenerate CHANGELOG.md from the commit history
// (show-recent-changes-from-the-version-badge). The status bar's version badge
// reads the committed file at build time, so the bundle carries it without git:
// run this whenever the history gains a user-facing commit, and commit the
// result.
//
// Only `feat:` and `fix:` subjects are user-facing. `chore:`, `docs:`, and
// `test:` commits describe the repository, not the app, so the badge never
// names them.

import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Entries the file keeps. The panel shows a slice of them. */
const LIMIT = 40
/** A conventional-commit subject, with its type and optional scope stripped. */
const USER_FACING = /^(?:feat|fix)(?:\([^)]*\))?!?:\s*(.+)$/

const HEADER = `# Changelog

What changed in Folio, newest first. Generated from the commit history by
\`npm run changelog\`, so an entry exists for every \`feat:\` and \`fix:\` commit
and for nothing else. The status bar's version badge reads this file.
`

function commits() {
  // `%ad` is the author date, which is the day the change landed in the
  // history the app is built from.
  const out = execFileSync('git', ['log', '--pretty=format:%ad%x09%s', '--date=short'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  return out
    .split('\n')
    .map((line) => {
      const [date, subject] = line.split('\t')
      const match = USER_FACING.exec(subject ?? '')
      return date && match ? { date, text: match[1].trim() } : null
    })
    .filter((entry) => entry !== null)
}

/** Group entries by their date, newest day first, keeping the newest `LIMIT`. */
function days(entries) {
  const kept = entries.slice(0, LIMIT)
  const grouped = []
  for (const entry of kept) {
    const day = grouped[grouped.length - 1]
    if (day && day.date === entry.date) day.texts.push(entry.text)
    else grouped.push({ date: entry.date, texts: [entry.text] })
  }
  return grouped
}

const entries = commits()
const body = days(entries)
  .map((day) => `## ${day.date}\n\n${day.texts.map((text) => `- ${text}`).join('\n')}`)
  .join('\n\n')

const file = join(process.cwd(), 'CHANGELOG.md')
writeFileSync(file, `${HEADER}\n${body}\n`)
console.log(`changelog — ${entries.length} entries, newest ${entries[0]?.date ?? 'none'} -> CHANGELOG.md`)
