import { expect, test, type Page } from '@playwright/test'
import {
  editor,
  filesSection,
  installVaultPicker,
  openVault,
  readVaultFile,
  seedVault,
  todayJournalPath,
} from './helpers/vault'

// openspec/specs/presentations: a page becomes a full-viewport deck. The deck is
// a modal dialog over the whole workspace, its slides come from top-level
// thematic breaks, and nothing it does reaches the folder.

const DECK = `# First

Intro text.

---

# Second

Middle.

---

# Third

End.
`

const deck = (page: Page) =>
  page.getByRole('dialog', { name: 'Presentation' })

/** Press a key with the focus inside the deck: the Close control is always
 *  focusable, so a disabled slide button cannot drop the focus on the body. */
async function pressInDeck(page: Page, key: string) {
  await deck(page).getByRole('button', { name: 'Close presentation' }).focus()
  await page.keyboard.press(key)
}

/** Present a page from its row's menu. */
async function present(page: Page, name: string) {
  await filesSection(page).getByRole('button', { name, exact: true }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Present', exact: true }).click()
  await expect(deck(page)).toBeVisible()
}

test('a row presents the page as a deck that replaces the workspace', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Deck.md': DECK,
    'pages/Log.md': 'A log.',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await filesSection(page).getByRole('button', { name: 'Log', exact: true }).click()
  await expect(editor(page)).toContainText('A log.')

  // The row that is not open presents too: the app opens it first.
  await present(page, 'Deck')
  await expect(deck(page)).toContainText('Intro text.')
  await expect(deck(page).locator('h1')).toHaveText('First')

  // The deck is the whole viewport, and the workspace underneath is inert: the
  // dialog is modal, so the rail and the panes cannot be reached.
  const box = (await deck(page).boundingBox())!
  const viewport = page.viewportSize()!
  expect(Math.round(box.width)).toBe(viewport.width)
  expect(Math.round(box.height)).toBe(viewport.height)
  expect(await deck(page).evaluate((el) => el.matches(':modal'))).toBe(true)
  expect(
    await page
      .locator('#folder-rail')
      .evaluate((el) => el.getBoundingClientRect().bottom > 0),
  ).toBe(true)

  // A slide is read-only: nothing in the deck takes typing.
  await expect(deck(page).locator('[contenteditable="true"], input, textarea')).toHaveCount(0)

  // Closing returns the workspace, on the page that was presented: a page that
  // was not open opened first, and stays open after the deck.
  await deck(page).getByRole('button', { name: 'Close presentation' }).click()
  await expect(deck(page)).toHaveCount(0)
  await expect(editor(page)).toContainText('Intro text.')
})

test('a top-level break delimits slides, and the deck reports its position', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Deck.md': DECK,
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await present(page, 'Deck')

  // Three slides, one at a time, with the position and the progress bar.
  await expect(deck(page)).toContainText('1 / 3')
  await expect(deck(page).getByRole('progressbar', { name: 'Slide progress' })).toHaveAttribute(
    'aria-valuenow',
    '1',
  )
  await expect(deck(page).getByRole('button', { name: 'Previous slide' })).toBeDisabled()

  // The controls move one slide at a time and stop at the ends.
  await deck(page).getByRole('button', { name: 'Next slide' }).click()
  await expect(deck(page).locator('h1')).toHaveText('Second')
  await expect(deck(page)).toContainText('2 / 3')
  await deck(page).getByRole('button', { name: 'Next slide' }).click()
  await expect(deck(page).locator('h1')).toHaveText('Third')
  await expect(deck(page).getByRole('button', { name: 'Next slide' })).toBeDisabled()
  await deck(page).getByRole('button', { name: 'Previous slide' }).click()
  await expect(deck(page).locator('h1')).toHaveText('Second')

  // The keyboard walks the deck too: arrows, Home, and End.
  await pressInDeck(page, 'ArrowRight')
  await expect(deck(page)).toContainText('3 / 3')
  await pressInDeck(page, 'ArrowLeft')
  await expect(deck(page)).toContainText('2 / 3')
  await pressInDeck(page, 'Home')
  await expect(deck(page)).toContainText('1 / 3')
  await pressInDeck(page, 'End')
  await expect(deck(page)).toContainText('3 / 3')
})

test('a break inside a code block is content, not a slide boundary', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Code.md': 'Intro\n\n---\n\n```text\n---\n```\n\n---\n\nEnd\n',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await present(page, 'Code')

  // The fenced `---` stayed inside its slide: three slides, not four.
  await expect(deck(page)).toContainText('1 / 3')
  await expect(deck(page)).toContainText('Intro')
  await deck(page).getByRole('button', { name: 'Next slide' }).click()
  await expect(deck(page).locator('pre')).toContainText('---')
  await expect(deck(page)).toContainText('2 / 3')
  await deck(page).getByRole('button', { name: 'Next slide' }).click()
  await expect(deck(page)).toContainText('End')
  await expect(deck(page)).toContainText('3 / 3')
})

test('unsaved edits are what present, and the file is untouched', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, { 'pages/Deck.md': 'Intro text.\n\n---\n\nLast.', [todayJournalPath()]: 'Today.' })
  await openVault(page)
  await filesSection(page).getByRole('button', { name: 'Deck', exact: true }).click()
  await expect(editor(page)).toContainText('Intro text.')
  await editor(page).click()
  await page.keyboard.press('Control+Home')
  await page.keyboard.type('Typed, not saved. ')

  await present(page, 'Deck')
  await expect(deck(page)).toContainText('Typed, not saved.')

  // The deck reads and writes no vault file: the page's file is what it was.
  expect(await readVaultFile(page, 'pages/Deck.md')).toBe('Intro text.\n\n---\n\nLast.')
})

test('fullscreen toggles from the deck without leaving it', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, { 'pages/Deck.md': DECK, [todayJournalPath()]: 'Today.' })
  await openVault(page)
  await present(page, 'Deck')

  const dialog = deck(page)
  await expect(dialog.getByRole('button', { name: 'Enter fullscreen' })).toBeVisible()

  // `f` asks the dialog for fullscreen. Headless Chromium may refuse; either
  // way the deck stays usable and its controls keep working, which is the
  // browser's answer read the way a user reads it.
  await page.keyboard.press('f')
  const entered = await page.evaluate(() => document.fullscreenElement !== null)
  if (entered) {
    await expect(dialog.getByRole('button', { name: 'Exit fullscreen' })).toBeVisible()
    await dialog.getByRole('button', { name: 'Exit fullscreen' }).click()
    await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true)
    await expect(dialog.getByRole('button', { name: 'Enter fullscreen' })).toBeVisible()
  } else {
    await expect(dialog.getByRole('button', { name: 'Enter fullscreen' })).toBeVisible()
  }

  // The deck still steps slides after the fullscreen attempt.
  await dialog.getByRole('button', { name: 'Next slide' }).click()
  await expect(dialog.locator('h1')).toHaveText('Second')

  // Escape closes the deck and hands the editor back as it was.
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})

test('a journal day has no present affordance', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, { 'pages/Log.md': 'A log.', [todayJournalPath()]: 'Today.' })
  await openVault(page)
  await expect(editor(page)).toContainText('Today.')

  // The open day is not a page row, and its menu is the reminder menu: no
  // Present among its items.
  const todayLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date())
  await page.getByRole('button', { name: todayLabel, exact: true }).click({ button: 'right' })
  await expect(page.getByRole('menuitem', { name: 'Present', exact: true })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Presentation' })).toHaveCount(0)
})
