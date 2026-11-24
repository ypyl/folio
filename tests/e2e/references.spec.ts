import { expect, test, type Page } from '@playwright/test'
import {
  editor,
  filesSection,
  installVaultPicker,
  metaSection,
  openVault,
  readVaultFile,
  seedVault,
  todayJournalPath,
} from './helpers/vault'

// openspec/specs/references: a page reference has exactly two forms, a
// date-shaped name is a journal day, and a page row drags into the open page.
// The drag needs a real DataTransfer and a real drop point, and a journal day
// needs the folder, so both run here.

/** A reference badge in the editor, by its literal text. */
const chip = (page: Page, text: string) => page.locator('.cm-content .ref', { hasText: text })

/** Accept the completion popup's active row after `typed`. */
async function complete(page: Page, typed: string): Promise<void> {
  await editor(page).click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type(typed)
  const popup = page.locator('.cm-tooltip-autocomplete')
  await expect(popup).toBeVisible()
  // The popup ignores keys for a beat after it opens.
  await page.waitForTimeout(200)
  await page.keyboard.press('Enter')
  await expect(popup).toHaveCount(0)
}

test('a date-shaped name names the journal day, with or without a note', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Plan.md': 'Meet on #[[2026-09-16]] and again on #2026-09-17, or #word.',
    'pages/word.md': 'The word page.',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await filesSection(page).getByRole('button', { name: 'Plan', exact: true }).click()
  await expect(editor(page)).toContainText('Meet on')

  // Both forms are references, and a hashtagged word is a page reference, not a
  // tag: the app has no tag surface at all.
  await expect(chip(page, '#[[2026-09-16]]')).toHaveCount(1)
  await expect(chip(page, '#2026-09-17')).toHaveCount(1)
  await expect(chip(page, '#2026-09-16')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /tags?/i })).toHaveCount(0)

  // Activating the date opens its journal day, whether or not the folder holds
  // a note for it, and creates nothing.
  await chip(page, '#[[2026-09-16]]').click()
  await expect(page.getByTitle('journals/2026-09-16.md')).toBeVisible()
  expect(await readVaultFile(page, 'journals/2026-09-16.md')).toBe('')

  // The word form follows the same rule.
  await filesSection(page).getByRole('button', { name: 'Plan', exact: true }).click()
  await chip(page, '#2026-09-17').click()
  await expect(page.getByTitle('journals/2026-09-17.md')).toBeVisible()
  expect(await readVaultFile(page, 'journals/2026-09-17.md')).toBe('')

  // A hashtagged word is a page, not a tag.
  await filesSection(page).getByRole('button', { name: 'Plan', exact: true }).click()
  await chip(page, '#word').click()
  await expect(editor(page)).toContainText('The word page.')
})

test('a name that is not a real date is an ordinary page', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Plan.md': 'Not a date: #[[2026-13-45]].',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await filesSection(page).getByRole('button', { name: 'Plan', exact: true }).click()

  await chip(page, '#[[2026-13-45]]').click()
  // The page whose name matches, not a journal day, and no file until it saves.
  await expect(page.getByTitle('pages/2026-13-45.md')).toBeVisible()
  expect(await readVaultFile(page, 'pages/2026-13-45.md')).toBe('')
  expect(await readVaultFile(page, 'journals/2026-13-45.md')).toBe('')
})

test('completion writes exactly one of the two forms', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Note.md': 'Starting point.\n',
    'pages/notes.md': 'Notes.',
    'pages/reading list.md': 'A list.',
    'pages/café.md': 'A café.',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await filesSection(page).getByRole('button', { name: 'Note', exact: true }).click()
  await expect(editor(page)).toContainText('Starting point.')

  // A single word completes in the word form.
  await complete(page, '\n#note')
  await expect(editor(page)).toContainText('#notes')

  // A multi-word name completes bracketed.
  await complete(page, ' and #reading')
  await expect(editor(page)).toContainText('#[[reading list]]')

  // A bracketed trigger stays bracketed, even for a single word.
  await complete(page, ' and #[[note')
  await expect(editor(page)).toContainText('#[[notes]]')

  // A name that is not a word completes bracketed: an accent and a dotted
  // number are not the word form's.
  await complete(page, ' and #caf')
  await expect(editor(page)).toContainText('#[[café]]')

  // Everything written is a reference that reads back to its page, and the last
  // line holds exactly the four tokens: no third form, no leftover text.
  const written = () =>
    readVaultFile(page, 'pages/Note.md').then((text) => text.split('\n').filter(Boolean).at(-1))
  await expect
    .poll(written)
    .toBe('#notes and #[[reading list]] and #[[notes]] and #[[café]]')
  await expect(chip(page, '#[[reading list]]')).toHaveCount(1)
  await expect(chip(page, '#[[café]]')).toHaveCount(1)
})

test('a plain wikilink is never a reference and gets no picker', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Note.md': 'Starting point.\n',
    'pages/reading.md': 'Reading.',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await filesSection(page).getByRole('button', { name: 'Note', exact: true }).click()

  await editor(page).click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type(' [[Rea')
  await page.waitForTimeout(400)
  await expect(page.locator('.cm-tooltip-autocomplete')).toHaveCount(0)

  // The text stays literal Markdown, and it is what the file holds after a save.
  await expect(editor(page)).toContainText('[[Rea')
  await expect
    .poll(() => readVaultFile(page, 'pages/Note.md'))
    .toContain('[[Rea')
  await expect(page.locator('.cm-content .ref')).toHaveCount(0)
})

test('a page row drags into the open page as a reference', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Note.md': 'Starting point.\n',
    'pages/reading.md': 'Reading.',
    'pages/reading list.md': 'A list.',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await filesSection(page).getByRole('button', { name: 'Note', exact: true }).click()
  await expect(editor(page)).toContainText('Starting point.')

  /** Drag a row onto the editor and release it on the document's last line, as
   *  the browser would: dragstart on the row puts the app's own payload on the
   *  transfer, and the drop writes it at the point it is released. */
  const dragRowToEnd = async (label: string) => {
    const point = await page.evaluate(() => {
      const lines = document.querySelectorAll('.cm-line')
      const last = lines[lines.length - 1]!.getBoundingClientRect()
      return { x: last.left + 1, y: last.top + last.height / 2 }
    })
    await page.evaluate(
      ({ label, x, y }) => {
        const row = [...document.querySelectorAll('#sidebar-pane li button')].find(
          (el) => el.textContent?.trim() === label,
        )
        if (!row) throw new Error(`no row ${label}`)
        const transfer = new DataTransfer()
        row.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: transfer }))
        const pane = document.querySelector('[data-tour="editor"]')!
        for (const type of ['dragover', 'drop']) {
          pane.dispatchEvent(
            new DragEvent(type, {
              bubbles: true,
              cancelable: true,
              dataTransfer: transfer,
              clientX: x,
              clientY: y,
            }),
          )
        }
      },
      { label, ...point },
    )
  }

  // A single-word page writes the word form; a multi-word page writes the
  // bracketed one. Neither drag opens the page it names.
  await dragRowToEnd('reading')
  await expect(editor(page)).toContainText('#reading')
  await expect(editor(page)).toContainText('Starting point.')

  await editor(page).click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type('\n')
  await dragRowToEnd('reading list')
  await expect(editor(page)).toContainText('#[[reading list]]')

  // A drag is a write into the open page, nothing else: the page that was
  // dragged from never opened, and the open page stays open.
  await expect(filesSection(page).getByRole('button', { name: 'Note', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect.poll(() => readVaultFile(page, 'pages/Note.md')).toContain('#reading')
  await expect
    .poll(() => readVaultFile(page, 'pages/Note.md'))
    .toContain('#[[reading list]]')

  await filesSection(page).getByRole('button', { name: 'reading list', exact: true }).click()
  const links = metaSection(page, 'Links')
  await links.locator('summary').click()
  await expect(links.getByRole('button', { name: 'Note', exact: true })).toBeVisible()
})
