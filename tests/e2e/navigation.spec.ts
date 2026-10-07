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
