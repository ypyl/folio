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

// openspec/specs/history (add-history-keyboard-shortcuts): Ctrl+[ and Ctrl+] step
// the session trail wherever focus is, and inside the editor they supersede
// CodeMirror's own list indent/outdent bindings.
test('the history chords step the trail with the caret in the editor', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Welcome.md': '- first item\n- second item\n',
    'pages/Reading.md': 'A running list of things to read.',
    [todayJournalPath()]: 'Started the day in the journal.',
  })
  await openVault(page)

  await page.getByRole('button', { name: 'Welcome', exact: true }).click()
  await page.getByRole('button', { name: 'Reading', exact: true }).click()
  await expect(editor(page)).toContainText('A running list')

  // Back to Welcome, then step forward with the caret on its list.
  await page.keyboard.press('Control+[')
  await expect(editor(page)).toContainText('first item')
  await editor(page).click()
  await page.keyboard.press('Control+End')
  const before = await editor(page).innerText()
  await page.keyboard.press('Control+]')
  await expect(editor(page)).toContainText('A running list')

  // The chord navigated instead of indenting: Welcome's list came back unchanged.
  await page.keyboard.press('Control+[')
  await expect.poll(() => editor(page).innerText()).toBe(before)

  // The keyboard-shortcuts reference lists both history chords on one shared row
  // (add-compact-the-history-shortcut-row, workspace spec).
  await page.getByText('Keyboard shortcuts').click()
  const historyRow = page.getByRole('listitem').filter({ hasText: 'Back / Forward' })
  await expect(historyRow.getByRole('button', { name: /^Back / })).toBeVisible()
  await expect(historyRow.getByRole('button', { name: /^Forward / })).toBeVisible()
})

// openspec/specs/workspace: the status bar's file name locates the open item in
// the navigation (focus-the-journal-day-in-the-calendar). A journal day's crumb
// brings the calendar back to the day's month and puts focus on its cell.
test("a journal day's name locates the day in the calendar", async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, { [todayJournalPath()]: 'Started the day in the journal.' })
  await openVault(page)

  // The day's file name, which is what the crumb prints and says
  // (name-the-crumb-with-what-it-shows), and the long date the calendar's own
  // cells carry, in the browser's pinned zone.
  const dayFile = todayJournalPath().split('/')[1]
  const dayLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())
  const dayCell = page.getByRole('button', { name: dayLabel, exact: true })
  await expect(dayCell).toBeVisible()

  // Browse the calendar away from the day's month, so its cell is not rendered.
  // Two months back, not one: the grid is a fixed 42 cells, so the previous
  // month's grid still carries the current month's first days, and on days 1
  // to 13 the cell would still be there.
  await page.getByRole('button', { name: 'Previous month' }).click()
  await page.getByRole('button', { name: 'Previous month' }).click()
  await expect(dayCell).toHaveCount(0)

  await page.getByRole('button', { name: `Show ${dayFile} in the Journal calendar` }).click()

  // The grid is back on the day's month, and the cell holds the focus.
  await expect(dayCell).toBeVisible()
  await expect(dayCell).toBeFocused()
})
