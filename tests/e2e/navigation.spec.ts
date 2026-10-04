import { expect, test } from '@playwright/test'
import { editor, installVaultPicker, openVault, seedVault, todayJournalPath } from './helpers/vault'

// openspec/specs/vault + openspec/specs/navigation: opening a folder, landing
// on today's journal, and choosing a page.
test("opening a vault lands on today's journal and lists its pages", async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Welcome.md': 'This is Folio, a folder of Markdown notes.',
    'pages/Reading.md': 'A running list of things to read.',
    [todayJournalPath()]: 'Started the day in the journal.',
  })
  await openVault(page)

  // The open folder's pages are listed.
  await expect(page.getByRole('button', { name: 'Welcome', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reading', exact: true })).toBeVisible()

  // The app opens today's journal by itself.
  await expect(editor(page)).toContainText('Started the day in the journal.')

  // Choosing a page opens it and marks its row active.
  await page.getByRole('button', { name: 'Welcome', exact: true }).click()
  await expect(editor(page)).toContainText('This is Folio')
  await expect(page.getByRole('button', { name: 'Welcome', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
})
