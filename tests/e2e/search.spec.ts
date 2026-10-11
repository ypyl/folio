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
