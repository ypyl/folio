import { expect, test } from '@playwright/test'
import { editor, installVaultPicker, openVault, seedVault } from './helpers/vault'

// openspec/specs/search: the spotlight searches the vault and opens a result.
test('searching the vault opens a matching page', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Welcome.md': 'A folder of Markdown notes.',
    'pages/Reading.md': 'A running list of things to read about backlinks.',
  })
  await openVault(page)

  // Wait for the vault to load (search is enabled only with a usable vault).
  await expect(page.getByRole('button', { name: 'Reading', exact: true })).toBeVisible()

  await page.keyboard.press('Control+k')
  await page.getByRole('textbox', { name: 'Search notes' }).fill('backlinks')

  // The match appears in the dropdown and opens on click.
  const result = page.getByRole('option', { name: /Reading/ })
  await expect(result).toBeVisible()
  await result.click()
  await expect(editor(page)).toContainText('things to read about backlinks')
})

// openspec/specs/search: a short query matches a whole word and never a word
// inside a longer one (search-short-terms).
test('a short query finds the page it names', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/UX.md': 'Notes about the product experience.',
    'pages/Linux.md': 'Kernel notes.',
  })
  await openVault(page)

  await expect(page.getByRole('button', { name: 'UX', exact: true })).toBeVisible()

  await page.keyboard.press('Control+p')
  await page.getByRole('textbox', { name: 'Search notes' }).fill('UX')

  // The page named UX matches; Linux does not, because "ux" sits inside it.
  const result = page.getByRole('option', { name: /UX/ })
  await expect(result).toBeVisible()
  await expect(page.getByRole('option', { name: /Linux/ })).toHaveCount(0)
  await result.click()
  await expect(editor(page)).toContainText('product experience')
})

// openspec/specs/search: an empty query offers the operators, and choosing one
// inserts its token (search operators).
test('an empty query lists the operators and a chosen one fills the input', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, { 'pages/Welcome.md': 'A folder of Markdown notes.' })
  await openVault(page)

  await expect(page.getByRole('button', { name: 'Welcome', exact: true })).toBeVisible()

  await page.keyboard.press('Control+k')
  const input = page.getByRole('textbox', { name: 'Search notes' })
  await expect(page.getByRole('listbox', { name: 'Search operators' })).toBeVisible()
  await expect(page.getByRole('option')).toHaveCount(5)

  await page.getByRole('option', { name: /Boards first/ }).click()
  await expect(input).toHaveValue('board: ')
  // The operator alone has no term, so no result set is deployed.
  await expect(page.getByRole('listbox', { name: 'Search results' })).toHaveCount(0)
})

// openspec/specs/search: an operator promotes its kind without hiding the rest
// (search operators).
test('an operator promotes its kind above the other groups', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Ops.md': 'The roadmap notes live here.',
    'boards/roadmap.excalidraw': '{}',
  })
  await openVault(page)

  await expect(page.getByRole('button', { name: 'Ops', exact: true })).toBeVisible()

  await page.keyboard.press('Control+k')
  await page.getByRole('textbox', { name: 'Search notes' }).fill('board: roadmap')

  const options = page.getByRole('listbox', { name: 'Search results' }).getByRole('option')
  await expect(options.first()).toHaveAccessibleName(/roadmap\.excalidraw/)
  // Promotion reorders, it does not filter: the matching page is still listed.
  await expect(page.getByRole('option', { name: /Ops/ })).toBeVisible()
})

// openspec/specs/search: `title:` leads with a Names section of title/name
// matches (search operators).
test('a title query leads with a Names section', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Backlinks.md': 'Notes about linking.',
    'pages/Welcome.md': 'A running list about backlinks.',
  })
  await openVault(page)

  await expect(page.getByRole('button', { name: 'Backlinks', exact: true })).toBeVisible()

  await page.keyboard.press('Control+k')
  await page.getByRole('textbox', { name: 'Search notes' }).fill('title: backlinks')

  const options = page.getByRole('listbox', { name: 'Search results' }).getByRole('option')
  await expect(page.getByText('Names', { exact: true })).toBeVisible()
  await expect(options.first()).toHaveAccessibleName(/Backlinks/)
  // The content-only match keeps its normal Pages group below.
  await expect(page.getByText('Pages', { exact: true })).toBeVisible()
})
