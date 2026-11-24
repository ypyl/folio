import { expect, test, type Page } from '@playwright/test'
import {
  editor,
  filesSection,
  installVaultPicker,
  listVaultFiles,
  openVault,
  seedVault,
  todayJournalPath,
} from './helpers/vault'

// openspec/specs/history: the session trail. Back, Forward, and Today ride the
// Journal row's trailing edge; the trail is written nowhere, and stepping is
// not a navigation.

const FILES = {
  'pages/Alpha.md': 'Alpha body.',
  'pages/Beta.md': 'Beta body.',
  'pages/Gamma.md': 'Gamma body.',
  'boards/Plan.excalidraw': '{}',
  [todayJournalPath()]: 'Today.',
}

const back = (page: Page) =>
  page.locator('#sidebar-pane').getByRole('button', { name: 'Back', exact: true })
const forward = (page: Page) =>
  page.locator('#sidebar-pane').getByRole('button', { name: 'Forward', exact: true })
const today = (page: Page) =>
  page.locator('#sidebar-pane').getByRole('button', { name: 'Today', exact: true })
const openPage = (page: Page, name: string) =>
  filesSection(page).getByRole('button', { name, exact: true }).click()

test('Back and Forward walk the pages and the board the session opened', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, FILES)
  await openVault(page)
  await expect(editor(page)).toContainText('Today.')

  // With only the app's own journal open there is nowhere back to go.
  await expect(back(page)).toBeDisabled()
  await expect(forward(page)).toBeDisabled()
  await expect(today(page)).toBeEnabled()

  await openPage(page, 'Alpha')
  await expect(editor(page)).toContainText('Alpha body.')
  await openPage(page, 'Beta')
  await expect(editor(page)).toContainText('Beta body.')
  await openPage(page, 'Plan.excalidraw')
  await expect(page.locator('.excalidraw canvas.interactive')).toBeVisible({ timeout: 20_000 })

  // Back returns through the pages, and a board's own entry goes back to the
  // page the board was opened from.
  await back(page).click()
  await expect(editor(page)).toContainText('Beta body.')
  await back(page).click()
  await expect(editor(page)).toContainText('Alpha body.')
  await expect(back(page)).toBeEnabled()
  await back(page).click()
  await expect(editor(page)).toContainText('Today.')

  // At the start there is nowhere further back, and Forward retraces the walk.
  await expect(back(page)).toBeDisabled()
  await expect(forward(page)).toBeEnabled()
  await forward(page).click()
  await expect(editor(page)).toContainText('Alpha body.')
  await forward(page).click()
  await expect(editor(page)).toContainText('Beta body.')
})

test('a new navigation from the middle discards what was ahead', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, FILES)
  await openVault(page)
  await expect(editor(page)).toContainText('Today.')

  await openPage(page, 'Alpha')
  await openPage(page, 'Beta')
  await openPage(page, 'Gamma')
  await expect(editor(page)).toContainText('Gamma body.')

  await back(page).click()
  await expect(editor(page)).toContainText('Beta body.')
  await expect(forward(page)).toBeEnabled()

  // Opening a page from the middle starts a fresh line: Gamma is no longer
  // ahead, so Forward has nowhere to go.
  await openPage(page, 'Alpha')
  await expect(editor(page)).toContainText('Alpha body.')
  await expect(forward(page)).toBeDisabled()

  // Opening the entry already open adds nothing to the trail.
  await openPage(page, 'Alpha')
  await expect(editor(page)).toContainText('Alpha body.')
  await back(page).click()
  await expect(editor(page)).toContainText('Beta body.')
})

test('a reload starts an empty trail, and stepping writes nothing', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, FILES)
  await openVault(page)
  await expect(editor(page)).toContainText('Today.')

  await openPage(page, 'Alpha')
  await openPage(page, 'Beta')
  await back(page).click()
  await expect(editor(page)).toContainText('Alpha body.')

  const before = (await listVaultFiles(page)).filter((path) => !path.startsWith('.folio/'))

  // Stepping moves the open page and adds no entry: two Backs and two Forwards
  // land back on Beta, not on a deeper trail.
  await back(page).click()
  await expect(editor(page)).toContainText('Today.')
  await forward(page).click()
  await forward(page).click()
  await expect(editor(page)).toContainText('Beta body.')
  await expect(forward(page)).toBeDisabled()

  // The trail lives only for the session.
  await page.reload()
  await expect(editor(page)).toContainText('Today.')
  await expect(back(page)).toBeDisabled()
  await expect(forward(page)).toBeDisabled()

  // Nothing was written anywhere by the walk.
  expect((await listVaultFiles(page)).filter((path) => !path.startsWith('.folio/'))).toEqual(before)
})
