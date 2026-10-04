import { expect, test } from '@playwright/test'
import { editor, installVaultPicker, openVault, seedVault } from './helpers/vault'

// openspec/specs/editing: the open page is edited in place and autosaves to the
// vault folder.
test('editing a page autosaves it to the vault', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, { 'pages/Welcome.md': 'Draft one.' })
  await openVault(page)

  await page.getByRole('button', { name: 'Welcome' }).click()
  await editor(page).click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type(' Edited.')
  await expect(editor(page)).toContainText('Draft one. Edited.')

  // The edit shows unsaved, then the debounced save clears the indicator.
  await expect(page.getByText('Unsaved changes')).toBeVisible()
  await expect(page.getByText('Unsaved changes')).toHaveCount(0, { timeout: 5000 })

  // Reload and reopen: the edit reached the file.
  await page.reload()
  await page.getByRole('button', { name: 'Welcome' }).click()
  await expect(editor(page)).toContainText('Draft one. Edited.')
})
