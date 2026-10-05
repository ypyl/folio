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

// openspec/specs/editing: typing a reference offers matching pages, and never
// inside code.
test('typing a reference completes a page and stays out of code', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Welcome.md': 'Start here.',
    'pages/Reading.md': 'A page about reading.',
  })
  await openVault(page)

  await page.getByRole('button', { name: 'Welcome' }).click()
  await editor(page).click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type(' #rea')

  const popup = page.locator('.cm-tooltip-autocomplete')
  await expect(popup).toBeVisible()
  await expect(popup.getByRole('option', { name: 'Reading' })).toBeVisible()

  // Enter accepts the active (first) row; the popup ignores keys for a beat
  // after it opens, so let it settle first.
  await page.waitForTimeout(200)
  await page.keyboard.press('Enter')
  await expect(editor(page)).toContainText('#Reading')

  // The same prefix inside a fenced block opens nothing.
  await page.keyboard.press('Control+End')
  await page.keyboard.type('\n```\n#rea')
  await page.waitForTimeout(400)
  await expect(page.locator('.cm-tooltip-autocomplete')).toHaveCount(0)
})
