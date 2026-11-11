import { describe, expect, it } from 'vitest'
import source from '../CHANGELOG.md?raw'
import { parseChangelog, recentChanges } from './changelog'

// The bundled changelog (show-recent-changes-from-the-version-badge): the file
// is generated from the commit history, and the app reads it as text. The
// parser is the seam between the two, so a hand-edited or truncated file has to
// degrade to what it can read rather than break the status bar.
describe('parseChangelog', () => {
  it('reads each date group and its bullets, newest first as written', () => {
    const changes = parseChangelog(
      [
        '# Changelog',
        '',
        'What changed.',
        '',
        '## 2026-11-10',
        '',
        '- ship the session trace in every build',
        '- refuse a page name the folder cannot hold',
        '',
        '## 2026-11-06',
        '',
        '- record a session trace in the vault',
        '',
      ].join('\n'),
    )
    expect(changes).toEqual([
      { date: '2026-11-10', text: 'ship the session trace in every build' },
      { date: '2026-11-10', text: 'refuse a page name the folder cannot hold' },
      { date: '2026-11-06', text: 'record a session trace in the vault' },
    ])
  })

  it('ignores anything that is not a date group or a bullet under one', () => {
    const changes = parseChangelog(
      [
        '- a bullet before any date',
        '# Changelog',
        '## Not a date',
        '- still nothing',
        '## 2026-01-02',
        'Some prose.',
        '- keep this',
        '## 2026-01-02',
        '- and this',
      ].join('\n'),
    )
    expect(changes).toEqual([
      { date: '2026-01-02', text: 'keep this' },
      { date: '2026-01-02', text: 'and this' },
    ])
  })

  it('reads a file written with CRLF line endings', () => {
    const changes = parseChangelog('## 2026-01-02\r\n\r\n- keep this\r\n')
    expect(changes).toEqual([{ date: '2026-01-02', text: 'keep this' }])
  })

  it('yields nothing for a file with no entries', () => {
    expect(parseChangelog('')).toEqual([])
    expect(parseChangelog('# Changelog\n\nNothing yet.\n')).toEqual([])
  })
})

describe('recentChanges', () => {
  it('carries the committed changelog, newest first', () => {
    // The file ships with the build, so the app always has entries to show.
    expect(recentChanges.length).toBeGreaterThan(0)
    const dates = recentChanges.map((change) => change.date)
    expect(dates).toEqual([...dates].sort().reverse())
    for (const change of recentChanges) {
      expect(change.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(change.text).not.toMatch(/^(feat|fix):/)
      expect(change.text.length).toBeGreaterThan(0)
    }
  })

  it('shows the newest entries only, past what the file keeps', () => {
    // The panel's cap: the file holds more than it shows, and what it shows is
    // its first entries.
    const all = parseChangelog(source)
    expect(recentChanges).toEqual(all.slice(0, recentChanges.length))
    expect(recentChanges.length).toBeLessThan(all.length)
  })
})
