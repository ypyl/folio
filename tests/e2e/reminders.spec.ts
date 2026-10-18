import { expect, test } from '@playwright/test'
import { editor, installVaultPicker, openVault, seedVault } from './helpers/vault'

// add-reminders (remind-from-the-calendar): set a reminder for the open page
// from a calendar day's menu, see it materialize into the day's note on open,
// and remove the rule while the written line stays. Real Chromium against the
// origin private file system; only the OS folder dialog is replaced
// (tests/e2e/helpers/vault.ts).

test('sets, materializes, and removes a reminder from the calendar', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, { 'pages/Ana.md': 'Ana\n' })
  await openVault(page)

  const files = page.locator('details', {
    has: page.locator('summary', { hasText: 'Files' }),
  })
  const todayLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date())
  const todayCell = page.getByRole('button', { name: todayLabel })

  // Open the page to be reminded about, then set the reminder from today's cell.
  await files.getByRole('button', { name: 'Ana', exact: true }).click()
  await expect(page.getByTitle('pages/Ana.md')).toBeVisible()
  await todayCell.click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Every day' }).click()

  // The open page now has a rule, so the day menu offers removal.
  await todayCell.click({ button: 'right' })
  await expect(page.getByRole('menuitem', { name: 'Remove reminder' })).toBeVisible()
  await page.keyboard.press('Escape')

  // Opening today's journal materializes the reminder line into the note.
  await page.getByRole('button', { name: 'Today' }).click()
  await expect(editor(page)).toContainText('#Ana')

  // Removing the rule clears the schedule; the written line stays.
  await files.getByRole('button', { name: 'Ana', exact: true }).click()
  await todayCell.click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Remove reminder' }).click()
  await todayCell.click({ button: 'right' })
  await expect(page.getByRole('menuitem', { name: 'Remove reminder' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Today' }).click()
  await expect(editor(page)).toContainText('#Ana')
})
