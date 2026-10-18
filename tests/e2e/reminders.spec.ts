import { expect, test } from '@playwright/test'
import { editor, installVaultPicker, openVault, seedVault } from './helpers/vault'

// add-reminders: set a rule on the open day, record it as one written line, and
// remove the rule while the record stays. Real Chromium against the origin
// private file system; only the OS folder dialog is replaced
// (tests/e2e/helpers/vault.ts).

test('sets, records, and removes a reminder on the open day', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, { 'pages/Welcome.md': 'Welcome\n' })
  await openVault(page)

  const reminders = page.locator('details', {
    has: page.locator('summary', { hasText: 'Reminders' }),
  })
  await expect(reminders).toBeVisible()
  await expect(reminders.getByText('No reminders for this day.')).toBeVisible()

  // Set a daily rule anchored on the open day: one rule, no page file.
  await reminders.getByLabel('Reminder page').fill('Take pills')
  await reminders.getByLabel('Repeat').selectOption('daily')
  await reminders.getByRole('button', { name: 'Add' }).click()

  // The pending row appears and records one reference into the note.
  const pending = reminders.getByRole('button', { name: 'Add Take pills to this day' })
  await expect(pending).toBeVisible()
  await pending.click()
  await expect(editor(page)).toContainText('#[[Take pills]]')

  // The row flips to recorded once the save lands.
  const recorded = reminders.getByRole('button', { name: 'Open Take pills' })
  await expect(recorded).toBeVisible()

  // Removing the rule clears the schedule; the written line stays.
  await recorded.click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Remove reminder' }).click()
  await expect(reminders.getByText('No reminders for this day.')).toBeVisible()
  await expect(editor(page)).toContainText('#[[Take pills]]')
})
