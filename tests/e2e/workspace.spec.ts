import { expect, test } from '@playwright/test'
import { installVaultPicker } from './helpers/vault'

// openspec/specs/workspace: the no-folder state before any vault is opened.
test('the no-folder state invites opening a folder', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')

  await expect(page.getByText('Open a folder to begin.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add folder' })).toBeVisible()

  // No vault yet: search is disabled, and the trail and Today have nowhere to go.
  await expect(page.getByRole('button', { name: 'Open search' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Back' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Forward' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Today' })).toBeDisabled()

  // The right panel is present, with its shortcuts reference.
  await expect(page.getByText('Keyboard shortcuts')).toBeVisible()

  // The project's public repository is reachable from here.
  const repo = page.getByRole('link', { name: 'Folio on GitHub' })
  await expect(repo).toBeVisible()
  await expect(repo).toHaveAttribute('href', 'https://github.com/ypyl/folio')
})
