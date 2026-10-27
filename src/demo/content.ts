import { localDayString } from '../vault/dates'
import { renderReminders } from '../vault/reminders'
import { DemoVaultStorage } from './storage'

// The guided demo's seed (add-guided-demo, design D4/D5): the vault's files live
// in `src/demo/vault/` in the same shape a real vault has, and are bundled as
// raw strings. Only the three journal templates need the current date, which the
// seed fills in; everything else is content the repository can review as
// Markdown. `createDemoVault` is called by App only when the user opens the demo.

import assetsPage from './vault/pages/Assets.md?raw'
import boardsPage from './vault/pages/Boards.md?raw'
import contentsPage from './vault/pages/Contents.md?raw'
import editingPage from './vault/pages/Editing and tasks.md?raw'
import inboxPage from './vault/pages/Inbox.md?raw'
import journalPage from './vault/pages/Journal.md?raw'
import linksPage from './vault/pages/Links and backlinks.md?raw'
import presentingPage from './vault/pages/Presenting.md?raw'
import readingListPage from './vault/pages/Reading list.md?raw'
import referencesPage from './vault/pages/References.md?raw'
import remindersPage from './vault/pages/Reminders.md?raw'
import searchPage from './vault/pages/Search.md?raw'
import standalonePage from './vault/pages/Standalone.md?raw'
import waterPage from './vault/pages/Water the plants.md?raw'
import weeklyPage from './vault/pages/Weekly review.md?raw'
import welcomePage from './vault/pages/Welcome.md?raw'
import todayNote from './vault/journals/today.md?raw'
import twoDaysAgoNote from './vault/journals/two-days-ago.md?raw'
import yesterdayNote from './vault/journals/yesterday.md?raw'
import board from './vault/boards/How Folio works.excalidraw?raw'
import flowImage from './vault/assets/folio-flow.svg?raw'
import readingListFile from './vault/assets/reading-list.txt?raw'

/** The rail id of the demo. Stable, so a second open reuses the listed row and
 *  its session contents instead of adding a duplicate (design D2). */
export const DEMO_ID = 'folio-demo'

/** The name the rail and the status bar show. It says what the vault is. */
export const DEMO_NAME = 'Demo vault'

/** The demo's landing page (design D3): the guide's table of contents, not the
 *  current day's journal. */
export const DEMO_WELCOME_PATH = 'pages/Welcome.md'

const PINS = `# Pinned pages - order is pin order, most recent first

- pages/Welcome.md
- pages/Reminders.md
`

/** The guide pages, by vault path. Welcome is last so it also wins the
 *  most-recently-edited order if the pins are removed by hand. */
const PAGES: Readonly<Record<string, string>> = {
  'pages/Assets.md': assetsPage,
  'pages/Boards.md': boardsPage,
  'pages/Contents.md': contentsPage,
  'pages/Editing and tasks.md': editingPage,
  'pages/Inbox.md': inboxPage,
  'pages/Journal.md': journalPage,
  'pages/Links and backlinks.md': linksPage,
  'pages/Presenting.md': presentingPage,
  'pages/Reading list.md': readingListPage,
  'pages/References.md': referencesPage,
  'pages/Reminders.md': remindersPage,
  'pages/Search.md': searchPage,
  'pages/Standalone.md': standalonePage,
  'pages/Water the plants.md': waterPage,
  'pages/Weekly review.md': weeklyPage,
  'pages/Welcome.md': welcomePage,
}

/** Build a pristine demo vault. `today` is injectable so tests can pin the
 *  calendar day the guide and the reminder rules talk about. */
export function createDemoVault(today: string = localDayString(new Date())): DemoVaultStorage {
  const yesterday = shiftDay(today, -1)
  const twoDaysAgo = shiftDay(today, -2)
  const fill = (text: string): string =>
    text
      .replaceAll('{{today}}', today)
      .replaceAll('{{yesterday}}', yesterday)
      .replaceAll('{{twoDaysAgo}}', twoDaysAgo)

  const files: Record<string, string> = {
    '.folio/pins.md': PINS,
    '.folio/reminders.md': renderReminders([
      { recurrence: 'daily', anchor: today, target: 'Water the plants' },
      { recurrence: 'weekly', anchor: today, target: 'Weekly review' },
    ]),
    [`journals/${today}.md`]: fill(todayNote),
    [`journals/${yesterday}.md`]: fill(yesterdayNote),
    [`journals/${twoDaysAgo}.md`]: fill(twoDaysAgoNote),
    'boards/How Folio works.excalidraw': board,
    'assets/folio-flow.svg': flowImage,
    'assets/reading-list.txt': readingListFile,
  }
  for (const [path, content] of Object.entries(PAGES)) files[path] = fill(content)
  return new DemoVaultStorage(files)
}

/** A local calendar day `delta` days from `day`, in the app's `YYYY-MM-DD`
 *  shape. Local parts, never `toISOString`, for the same reason the journal
 *  calendar uses them (dates.ts). */
function shiftDay(day: string, delta: number): string {
  const [year, month, date] = day.split('-').map(Number)
  return localDayString(new Date(year, month - 1, date + delta))
}
