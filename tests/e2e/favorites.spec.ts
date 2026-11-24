import { expect, test, type Page } from '@playwright/test'
import {
  editor,
  filesSection,
  installVaultPicker,
  metaPanel,
  openVault,
  readVaultFile,
  seedVault,
  todayJournalPath,
} from './helpers/vault'

// openspec/specs/favorites: a favorite is a property of a page in one vault.
// The state lives in the folder (`.folio/pins.md`), so these checks use a real
// folder handle and a real reload, which is what "travels with the folder"
// means; jsdom can only assert that the call was made.

/** A page row in the Files listing, by its label. */
const pageRow = (page: Page, name: string) =>
  filesSection(page).getByRole('button', { name, exact: true })

/** Open a page row's menu and activate an item from it. */
async function chooseRowAction(page: Page, name: string, item: string) {
  await pageRow(page, name).click({ button: 'right' })
  await page.getByRole('menuitem', { name: item, exact: true }).click()
}

test('a page is favorited from its row and the state lives in the folder', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Ideas.md': 'Ideas to keep close.',
    'pages/Vision.md': 'Where this goes.',
    'pages/Log.md': 'A log.',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await expect(pageRow(page, 'Ideas')).toBeVisible()

  // The row carries the action: Favorite and Present, nothing else, and no
  // visible trigger for the menu.
  await pageRow(page, 'Ideas').click({ button: 'right' })
  await expect(page.getByRole('menuitem')).toHaveText(['Favorite', 'Present'])
  expect(await pageRow(page, 'Ideas').evaluate((el) => el.querySelectorAll('button').length)).toBe(0)

  await page.getByRole('menuitem', { name: 'Favorite', exact: true }).click()

  // Two favorite actions, most recent first: Ideas above Vision.
  await expect(pageRow(page, 'Ideas')).toHaveAttribute('data-pinned', 'true')
  await chooseRowAction(page, 'Vision', 'Favorite')
  await expect(pageRow(page, 'Vision')).toHaveAttribute('data-pinned', 'true')
  const firstRows = await filesSection(page)
    .locator('button[data-path]')
    .evaluateAll((els) => els.slice(0, 2).map((el) => el.getAttribute('data-path')))
  expect(firstRows).toEqual(['pages/Vision.md', 'pages/Ideas.md'])

  // The favorite style is the row's own: a bolder title, no icon, no nested
  // control.
  const weights = await filesSection(page)
    .locator('button[data-path]')
    .evaluateAll((els) =>
      els.map((el) => [el.getAttribute('data-path'), getComputedStyle(el).fontWeight]),
    )
  const weightOf = (path: string) => weights.find(([p]) => p === path)?.[1]
  expect(Number(weightOf('pages/Vision.md'))).toBeGreaterThan(Number(weightOf('pages/Log.md')))
  expect(await pageRow(page, 'Vision').evaluate((el) => el.querySelector('svg, button'))).toBeNull()

  // The menu reads the state now.
  await pageRow(page, 'Vision').click({ button: 'right' })
  await expect(page.getByRole('menuitem', { name: 'Unfavorite', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')

  // The state is a vault file, keyed by path, and it is never content of its
  // own: no row, no page, no search result.
  await expect
    .poll(() => readVaultFile(page, '.folio/pins.md'))
    .toContain('- pages/Vision.md\n- pages/Ideas.md\n')
  await expect(filesSection(page).getByRole('button', { name: /pins/ })).toHaveCount(0)
  // No favorite control anywhere but the menu.
  await expect(page.locator('footer').getByRole('button', { name: /favorite|pin/i })).toHaveCount(0)
})

test('reopening the folder restores the favorites, in their order', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Ideas.md': 'Ideas to keep close.',
    'pages/Vision.md': 'Where this goes.',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await expect(pageRow(page, 'Ideas')).toBeVisible()

  await chooseRowAction(page, 'Vision', 'Favorite')
  await chooseRowAction(page, 'Ideas', 'Favorite')
  await expect(pageRow(page, 'Ideas')).toHaveAttribute('data-pinned', 'true')

  // A reload is a fresh start over the same folder: the order is read back
  // from the file, most recently favorited first.
  await page.reload()
  await expect(pageRow(page, 'Ideas')).toHaveAttribute('data-pinned', 'true')
  await expect(pageRow(page, 'Vision')).toHaveAttribute('data-pinned', 'true')
  const firstRows = await filesSection(page)
    .locator('button[data-path]')
    .evaluateAll((els) => els.slice(0, 2).map((el) => el.getAttribute('data-path')))
  expect(firstRows).toEqual(['pages/Ideas.md', 'pages/Vision.md'])
})

test('unfavoriting returns the page to the normal row, and a day has no menu', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Ideas.md': 'Ideas to keep close.',
    'pages/Log.md': 'A log.',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await expect(pageRow(page, 'Ideas')).toBeVisible()

  await chooseRowAction(page, 'Ideas', 'Favorite')
  await expect(pageRow(page, 'Ideas')).toHaveAttribute('data-pinned', 'true')

  const pinnedWeight = await pageRow(page, 'Ideas').evaluate((el) => getComputedStyle(el).fontWeight)
  await chooseRowAction(page, 'Ideas', 'Unfavorite')

  // Back to the ordinary row: no pinned marking, the normal weight, and the
  // menu reads Favorite again.
  await expect(pageRow(page, 'Ideas')).not.toHaveAttribute('data-pinned')
  const plainWeight = await pageRow(page, 'Ideas').evaluate((el) => getComputedStyle(el).fontWeight)
  expect(Number(plainWeight)).toBeLessThan(Number(pinnedWeight))
  await pageRow(page, 'Ideas').click({ button: 'right' })
  await expect(page.getByRole('menuitem', { name: 'Favorite', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')

  // The stored state went with it: only the file's header is left.
  await expect.poll(() => readVaultFile(page, '.folio/pins.md')).toContain('\n')
  expect(await readVaultFile(page, '.folio/pins.md')).not.toContain('pages/Ideas.md')

  // A journal day is not a page row: with a page open (the reminder menu's
  // target), its menu offers reminders only, never a favorite.
  await pageRow(page, 'Log').click()
  await expect(editor(page)).toContainText('A log.')
  const today = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date())
  await page.getByRole('button', { name: today, exact: true }).click({ button: 'right' })
  await expect(page.getByRole('menuitem', { name: 'Every day' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Favorite', exact: true })).toHaveCount(0)
  await page.keyboard.press('Escape')

  // The day menu left the page and the session where they were.
  await expect(editor(page)).toContainText('A log.')
  await expect(metaPanel(page)).toBeVisible()
})
