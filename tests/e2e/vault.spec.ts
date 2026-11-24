import { expect, test } from '@playwright/test'
import {
  editor,
  filesSection,
  installVaultPicker,
  listVaultFiles,
  metaSection,
  openVault,
  readVaultFile,
  seedVault,
  todayJournalPath,
  writeVaultFile,
} from './helpers/vault'

// openspec/specs/vault: the folder is the database. These checks need what a
// real browser gives the app and jsdom cannot: a directory handle that survives
// a reload (the registry stores the handle, not a copy of the folder), a scan
// triggered by the window regaining focus, and a folder closed for good.

const FOLDER = 'Vault'

/** The vault's notes and boards, without the app's own `.folio/` state (the
 *  session trace lives there, and tracing needs no switch). */
const content = (paths: string[]) => paths.filter((path) => !path.startsWith('.folio/'))

test('a folder reopens on its own after a reload', async ({ page }) => {
  await installVaultPicker(page, FOLDER)
  await page.goto('/')
  await seedVault(
    page,
    {
      'pages/Welcome.md': 'This is Folio, a folder of Markdown notes.',
      'pages/Reading.md': 'A running list of things to read.',
      [todayJournalPath()]: 'Started the day in the journal.',
    },
    FOLDER,
  )
  await openVault(page)

  // The folder is open and active: its page is listed, and the app landed on
  // today's journal by itself.
  await expect(page.getByRole('button', { name: 'Welcome', exact: true })).toBeVisible()
  await expect(editor(page)).toContainText('Started the day in the journal.')
  await expect(
    page.locator('#folder-rail').getByRole('button', { name: `Open folder ${FOLDER}` }),
  ).toHaveAttribute('aria-current', 'page')

  // The reload asks for nothing: no picker, no no-folder state, the same folder
  // active and the same content read from the folder itself.
  await page.reload()
  await expect(
    page.locator('#folder-rail').getByRole('button', { name: `Open folder ${FOLDER}` }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(page.getByText('Open a folder to begin.')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Reading', exact: true })).toBeVisible()
  await expect(editor(page)).toContainText('Started the day in the journal.')

  // Nothing was created in the folder to remember the page or the app state:
  // the three notes are still the whole vault.
  expect(content(await listVaultFiles(page, FOLDER))).toEqual([
    todayJournalPath(),
    'pages/Reading.md',
    'pages/Welcome.md',
  ])
})

test('closing a folder returns to the brand screen and is not restored', async ({ page }) => {
  await installVaultPicker(page, FOLDER)
  await page.goto('/')
  await seedVault(page, { 'pages/Welcome.md': 'This is Folio.' }, FOLDER)
  await openVault(page)
  await expect(page.getByRole('button', { name: 'Welcome', exact: true })).toBeVisible()

  const before = content(await listVaultFiles(page, FOLDER))

  await page.locator('#folder-rail').getByRole('button', { name: `Close folder ${FOLDER}` }).click()

  // The no-folder state, and the closed folder is no longer listed.
  await expect(page.getByText('Open a folder to begin.')).toBeVisible()
  await expect(
    page.locator('#folder-rail').getByRole('button', { name: `Open folder ${FOLDER}` }),
  ).toHaveCount(0)

  // Closing changed nothing inside the folder.
  expect(content(await listVaultFiles(page, FOLDER))).toEqual(before)

  // And a later start does not restore it: the registry row went with the
  // close, so the app is back at the no-folder state after a reload.
  await page.reload()
  await expect(page.getByText('Open a folder to begin.')).toBeVisible()
  await expect(
    page.locator('#folder-rail').getByRole('button', { name: `Open folder ${FOLDER}` }),
  ).toHaveCount(0)
})

test('a change made outside the app appears when the window regains focus', async ({ page }) => {
  await installVaultPicker(page, FOLDER)
  await page.goto('/')
  await seedVault(
    page,
    {
      'pages/Topic.md': 'Everything about the topic.',
      'pages/Notes.md': 'A note about #Topic.',
      [todayJournalPath()]: 'Started the day.',
    },
    FOLDER,
  )
  await openVault(page)
  await page.getByRole('button', { name: 'Topic', exact: true }).click()
  await expect(editor(page)).toContainText('Everything about the topic.')

  // A page added to the folder outside the app, a note edited outside the app,
  // and the open page rewritten outside the app, all while the tab sits open.
  await writeVaultFile(page, 'pages/Fresh.md', 'Arrived from outside.', FOLDER)
  await writeVaultFile(page, 'pages/Notes.md', 'Now it says #Topic and more.', FOLDER)
  await writeVaultFile(page, 'pages/Topic.md', 'Rewritten outside the app.', FOLDER)
  await writeVaultFile(page, 'pages/Reading.md', 'A third page.', FOLDER)

  // The window regaining focus is the refresh: no timer, no manual reload.
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))

  await expect(filesSection(page).getByRole('button', { name: 'Fresh', exact: true })).toBeVisible()
  // The open page follows the folder: its text is the folder's, not the stale
  // pane it was seeded with.
  await expect(editor(page)).toContainText('Rewritten outside the app.')

  // A page removed outside the app leaves the listing.
  await writeVaultFile(page, 'pages/Fresh.md', null, FOLDER)
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(filesSection(page).getByRole('button', { name: 'Fresh', exact: true })).toHaveCount(0)

  // The app wrote nothing: every file in the folder is one the test put there.
  expect(content(await listVaultFiles(page, FOLDER))).toEqual([
    todayJournalPath(),
    'pages/Notes.md',
    'pages/Reading.md',
    'pages/Topic.md',
  ])
  expect(await readVaultFile(page, 'pages/Topic.md', FOLDER)).toBe('Rewritten outside the app.')
})

test("a page's Links list holds every referencing form", async ({ page }) => {
  await installVaultPicker(page, FOLDER)
  await page.goto('/')
  await seedVault(
    page,
    {
      'pages/Topic.md': 'Everything about the topic. It mentions #Topic.',
      'pages/Word.md': 'A note about #Topic.',
      'pages/Bracketed.md': 'A note about #[[Topic]].',
      [todayJournalPath()]: 'Started the day.',
    },
    FOLDER,
  )
  await openVault(page)
  await page.getByRole('button', { name: 'Topic', exact: true }).click()
  await expect(editor(page)).toContainText('Everything about the topic.')

  const links = metaSection(page, 'Links')
  await links.locator('summary').click()

  // A `#word` reference and a `#[[bracketed]]` reference both reach the page.
  await expect(links.getByRole('button', { name: 'Word', exact: true })).toBeVisible()
  await expect(links.getByRole('button', { name: 'Bracketed', exact: true })).toBeVisible()

  // Activating a backlink opens the page that names it.
  await links.getByRole('button', { name: 'Word', exact: true }).click()
  await expect(editor(page)).toContainText('A note about #Topic.')
})
