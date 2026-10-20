import { expect, test } from '@playwright/test'
import { editor, installVaultPicker, openVault, seedVault } from './helpers/vault'

// add-reminders (remind-from-the-calendar): set a reminder for the open page
// from a calendar day's menu, see it materialize into the day's note on open,
// replace it through the confirmation, and remove it from the page's row menu
// while the written line stays (confirm-replacing-a-reminder). Real Chromium
// against the origin private file system; only the OS folder dialog is replaced
// (tests/e2e/helpers/vault.ts).

test('sets, replaces, materializes, and removes a reminder', async ({ page }) => {
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

  // The day menu chooses recurrences only: no removal item, and the items stay
  // stacked in one column under the header, not inline.
  await todayCell.click({ button: 'right' })
  expect(await page.getByRole('menuitem').count()).toBe(5)
  await expect(page.getByRole('menuitem', { name: 'Remove reminder' })).toHaveCount(0)
  const tops = await page
    .getByRole('menuitem')
    .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)))
  expect(new Set(tops).size).toBe(tops.length)
  expect(tops).toEqual([...tops].sort((a, b) => a - b))

  // Choosing another recurrence asks first; cancelling keeps the daily rule.
  await page.getByRole('menuitem', { name: 'Every month' }).click()
  const dialog = page.getByRole('dialog', { name: 'Replace reminder?' })
  await expect(dialog).toContainText('every day from')
  await expect(dialog).toContainText('every month from')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)

  // Opening today's journal materializes the reminder line into the note.
  await page.getByRole('button', { name: 'Today' }).click()
  await expect(editor(page)).toContainText('#Ana')

  // Confirming a replacement writes the chosen schedule.
  await files.getByRole('button', { name: 'Ana', exact: true }).click()
  await todayCell.click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Every week' }).click()
  await page.getByRole('button', { name: 'Replace' }).click()
  await expect(page.getByRole('dialog', { name: 'Replace reminder?' })).toHaveCount(0)

  // Removing the rule from the page's row menu clears the schedule; the written
  // line stays.
  const row = files.getByRole('button', { name: 'Ana', exact: true })
  await row.click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Remove reminder' }).click()
  await row.click({ button: 'right' })
  await expect(page.getByRole('menuitem', { name: 'Remove reminder' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Today' }).click()
  await expect(editor(page)).toContainText('#Ana')
})
