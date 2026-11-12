import { describe, expect, it } from 'vitest'
import source from '../CHANGELOG.md?raw'
import { parseChangelog, recentChanges } from './changelog'

// The bundled changelog (show-recent-changes-from-the-version-badge,
// group-the-changelog-by-version): the file is generated from the commit
// history and the app reads it as text. The parser is the seam between the two,
// so a hand-edited or truncated file has to degrade to what it can read rather
// than break the status bar.
describe('parseChangelog', () => {
  it('reads each version group and its bullets, newest first as written', () => {
    const groups = parseChangelog(
      [
        '# Changelog',
        '',
        'What changed.',
        '',
        '## v0.92.2 (2026-11-12)',
        '',
        '- give the installed icon opaque corners',
        '',
        '## v0.92.0 (2026-11-11)',
        '',
        '- move the Logseq import to a repo script',
        '- second change under the same version',
        '',
      ].join('\n'),
    )
    expect(groups).toEqual([
      {
        version: '0.92.2',
        date: '2026-11-12',
        texts: ['give the installed icon opaque corners'],
      },
      {
        version: '0.92.0',
        date: '2026-11-11',
        texts: ['move the Logseq import to a repo script', 'second change under the same version'],
      },
    ])
  })

  it('ignores anything that is not a version heading or a bullet under one', () => {
    const groups = parseChangelog(
      [
        '- a bullet before any version',
        '# Changelog',
        '## 2026-01-02',
        '- a date-only heading',
        '## v1.0.0',
        '- a heading without a date',
        '## v1.2.3 (2026-01-02)',
        'Some prose.',
        '- keep this',
        '## v1.2.4 (2026-01-03)',
        '- and this',
      ].join('\n'),
    )
    expect(groups).toEqual([
      { version: '1.2.3', date: '2026-01-02', texts: ['keep this'] },
      { version: '1.2.4', date: '2026-01-03', texts: ['and this'] },
    ])
  })

  it('drops a version heading with no bullets', () => {
    const groups = parseChangelog(
      '## v1.0.0 (2026-01-01)\n\n## v1.0.1 (2026-01-02)\n\n- keep this\n',
    )
    expect(groups).toEqual([{ version: '1.0.1', date: '2026-01-02', texts: ['keep this'] }])
  })

  it('reads a file written with CRLF line endings', () => {
    const groups = parseChangelog('## v1.0.0 (2026-01-02)\r\n\r\n- keep this\r\n')
    expect(groups).toEqual([{ version: '1.0.0', date: '2026-01-02', texts: ['keep this'] }])
  })

  it('yields nothing for a file with no entries', () => {
    expect(parseChangelog('')).toEqual([])
    expect(parseChangelog('# Changelog\n\nNothing yet.\n')).toEqual([])
  })
})

describe('recentChanges', () => {
  it('carries the committed changelog, newest version first', () => {
    // The file ships with the build, so the app always has entries to show.
    expect(recentChanges.length).toBeGreaterThan(0)
    for (const group of recentChanges) {
      expect(group.version).toMatch(/^\d+\.\d+\.\d+$/)
      expect(group.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(group.texts.length).toBeGreaterThan(0)
      for (const text of group.texts) {
        expect(text).not.toMatch(/^(feat|fix):/)
        expect(text.length).toBeGreaterThan(0)
      }
    }
    // Versions only grow, so the file's newest-first order is descending.
    const seen = recentChanges.map((group) => group.version)
    expect(seen).toEqual([...seen].sort(compareVersions).reverse())
    const dates = recentChanges.map((group) => group.date)
    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('shows the newest changes only, past what the file keeps', () => {
    // The panel's cap: the file holds more than it shows, and what it shows is
    // its first changes, never a split version group.
    const all = parseChangelog(source).flatMap((group) => group.texts)
    expect(recentChanges.flatMap((group) => group.texts)).toEqual(all.slice(0, 20))
    expect(all.length).toBeGreaterThan(20)
  })
})

function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number)
  const right = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] - right[i]
  }
  return 0
}
