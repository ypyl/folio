import { expect, test, type Page } from '@playwright/test'
import {
  editor,
  filesSection,
  installVaultPicker,
  listVaultFiles,
  metaSection,
  openVault,
  seedVault,
  todayJournalPath,
} from './helpers/vault'

// openspec/specs/files: a vault file is not a page, and opening one is the
// browser's job. jsdom cannot watch a window open or a download start, so these
// checks run against the real browser: the displayable branch, the download
// branch (SVG included), and the rule that nothing in the app's state moves.

/** The Files listing's rows, in order, as their raw text (badge included). */
const listingRows = (page: Page) =>
  filesSection(page)
    .locator('li button')
    .evaluateAll((els) => els.map((el) => el.textContent ?? ''))

test('the listing holds the folder’s files, badged and after the pages', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Log.md': 'A log.',
    'pages/Reading.md': 'A list.',
    'assets/notes.txt': 'Plain text.',
    'assets/2026/q3.pdf': 'not really a pdf',
    'assets/shot.png': 'not really a png',
    'boards/Plan.excalidraw': '{}',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await expect(filesSection(page).getByRole('button', { name: 'Log', exact: true })).toBeVisible()

  // Pages lead, then the board, then the files by path: the nested one is
  // labelled by its path inside the files folder, and the `a` badge marks it.
  await expect
    .poll(() => listingRows(page))
    .toEqual([
      expect.stringMatching(/^(Log|Reading)$/),
      expect.stringMatching(/^(Log|Reading)$/),
      'bPlan.excalidraw',
      'a2026/q3.pdf',
      'anotes.txt',
      'ashot.png',
    ])

  // A file no page references is listed like any other, and a file is never a
  // page row: no active marking, no page.
  await expect(filesSection(page).getByRole('button', { name: 'shot.png', exact: true })).toBeVisible()
  expect(
    await filesSection(page).getByRole('button', { name: 'shot.png' }).getAttribute('aria-current'),
  ).toBeNull()
})

test('a displayable file opens in a window and leaves the session alone', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Log.md': 'A log.',
    // A name carrying a percent sign: the listing row names the literal path,
    // which must reach the file rather than a decoded one.
    'assets/50% off.txt': 'A note on the sale.',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await page.getByRole('button', { name: 'Log', exact: true }).click()
  await expect(editor(page)).toContainText('A log.')
  await editor(page).click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type(' Unsaved edit.')
  await expect(page.getByText('Unsaved changes')).toBeVisible()

  const files = filesSection(page)
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    files.getByRole('button', { name: '50% off.txt', exact: true }).click(),
  ])

  // What opened is a copy of the file's bytes, in a window of its own. The
  // window is opened before the read (a user gesture is what allows it), so it
  // is pointed at the bytes once they are read.
  await expect.poll(() => popup.url()).toMatch(/^blob:/)
  await popup.close()

  // The app is where it was: the page, its unsaved edit, its active marking,
  // and the folder (no write came out of opening a file).
  await expect(editor(page)).toContainText('Unsaved edit.')
  await expect(page.getByText('Unsaved changes')).toBeVisible()
  await expect(files.getByRole('button', { name: 'Log', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  const content = (await listVaultFiles(page)).filter((path) => !path.startsWith('.folio/'))
  expect(content).toEqual(['assets/50% off.txt', todayJournalPath(), 'pages/Log.md'])
})

test('an SVG and an archive download instead of opening a window', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Log.md': 'A log.',
    'assets/chart.svg': '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>',
    'assets/bundle.zip': 'PK\u0003\u0004',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await page.getByRole('button', { name: 'Log', exact: true }).click()
  await expect(editor(page)).toContainText('A log.')

  const files = filesSection(page)
  const windows: string[] = []
  page.on('popup', (popup) => windows.push(popup.url()))

  const [svgDownload] = await Promise.all([
    page.waitForEvent('download'),
    files.getByRole('button', { name: 'chart.svg', exact: true }).click(),
  ])
  expect(svgDownload.suggestedFilename()).toBe('chart.svg')

  const [zipDownload] = await Promise.all([
    page.waitForEvent('download'),
    files.getByRole('button', { name: 'bundle.zip', exact: true }).click(),
  ])
  expect(zipDownload.suggestedFilename()).toBe('bundle.zip')

  // Neither file opened a document: an SVG's own script would run with the
  // app's origin there.
  expect(windows).toEqual([])
  await expect(editor(page)).toContainText('A log.')
})

test('a page’s Links list holds its files, and a file row opens the file', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Plan.md': 'The plan is in [notes.txt](assets/notes.txt).',
    'assets/notes.txt': 'Plain text.',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await page.getByRole('button', { name: 'Plan', exact: true }).click()
  await expect(editor(page)).toContainText('The plan is in')

  const links = metaSection(page, 'Links')
  await links.locator('summary').click()
  const fileRow = links.getByRole('button', { name: 'notes.txt', exact: true })
  await expect(fileRow).toBeVisible()

  const [popup] = await Promise.all([page.waitForEvent('popup'), fileRow.click()])
  await expect.poll(() => popup.url()).toMatch(/^blob:/)
  await popup.close()

  // The open page stayed open: a file row is not a page row.
  await expect(editor(page)).toContainText('The plan is in')
  await expect(filesSection(page).getByRole('button', { name: 'Plan', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
})
