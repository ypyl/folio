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
