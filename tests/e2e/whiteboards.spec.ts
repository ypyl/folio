import { expect, test, type Page } from '@playwright/test'
import {
  editor,
  installVaultPicker,
  listVaultFiles,
  openVault,
  readVaultFile,
  seedVault,
  todayJournalPath,
} from './helpers/vault'

// openspec/specs/whiteboards: a board with no elements shows a note naming its
// `#!` reference token (add-board-empty-state-note), takes no pointer input,
// and clears once the board holds an element.
test('a blank board shows a note that names its reference and does not block the canvas', async ({
  page,
}) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, { 'pages/Ideas.md': 'A sketch: #![[Some Name]]' })
  await openVault(page)
  await page.getByRole('button', { name: 'Ideas' }).click()

  // Activate the board badge: a reference with no file opens a blank board.
  await page.getByText('#![[Some Name]]', { exact: true }).click()

  const note = page.locator('[data-board-note]')
  await expect(note).toBeVisible()
  await expect(note).toContainText('#![[Some Name]]')

  // Presentational only: the note takes no pointer input, so it cannot swallow
  // a draw.
  expect(await note.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none')

  // Drawing over the note's area creates an element, which clears the note.
  const canvas = page.locator('.excalidraw canvas.interactive')
  await expect(canvas).toBeVisible()
  const box = (await canvas.boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  // Focus the editor's canvas, pick the rectangle tool, then drag.
  await page.mouse.click(cx, cy)
  await page.keyboard.press('r')
  await page.mouse.move(cx - 40, cy - 30)
  await page.mouse.down()
  await page.mouse.move(cx + 60, cy + 40, { steps: 8 })
  await page.mouse.up()

  await expect(note).toHaveCount(0)
})

// ---------------------------------------------------------------------------

/** The board badge in the editor: a reference whose target is a board. */
const boardChip = (page: Page) => page.locator('.cm-content .ref[data-ref-kind="board"]')

/** The sidebar's Files listing. */
const filesSection = (page: Page) =>
  page
    .locator('#sidebar-pane details')
    .filter({ has: page.locator('summary', { hasText: 'Files' }) })

test('a board reference renders as its own badge and a code block keeps it literal', async ({
  page,
}) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Ideas.md':
      'Sketch: #![[How it works]] beside #Topic.\n\n```\n#![[How it works]]\n```\n',
    'pages/Topic.md': 'The topic.',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await page.getByRole('button', { name: 'Ideas' }).click()
  await expect(editor(page)).toContainText('Sketch:')

  // One board badge in the prose; the fenced one stays literal text.
  await expect(boardChip(page)).toHaveCount(1)
  await expect(boardChip(page)).toHaveText('#![[How it works]]')
  const pageChip = () => page.locator('.cm-content .ref[data-ref-kind="page"]')
  await expect(pageChip()).toHaveText('#Topic')

  // Each badge carries the kind its token names; the board's own `#!` form is
  // what a reader sees on it. (Both badges share the editor's chip paint today,
  // so the token's form is the difference the stylesheet does not draw.)
  await expect(boardChip(page)).toHaveAttribute('data-ref-target', 'How it works')
  await expect(pageChip()).toHaveAttribute('data-ref-target', 'Topic')

  // Activating the badge opens the board and changes nothing on disk.
  await boardChip(page).click()
  await expect(page.locator('.excalidraw canvas.interactive')).toBeVisible({ timeout: 20_000 })
  expect(await readVaultFile(page, 'pages/Ideas.md')).toContain('#![[How it works]]')
})

test('the Files listing lists boards and the panel lists what references them', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Alpha.md': 'The plan is #![[Plan]].',
    'pages/Beta.md': 'Also the plan: #!Plan.',
    'pages/Log.md': 'A log.',
    'boards/Plan.excalidraw': '{}',
    'assets/shot.png': 'not really a png',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await expect(filesSection(page).getByRole('button', { name: 'Log', exact: true })).toBeVisible()

  // The board is a row of its own, badged `b`, after the pages and before the
  // files, and activating it opens the board.
  const boardRow = filesSection(page).getByRole('button', { name: 'Plan.excalidraw' })
  await expect(boardRow).toContainText('b')
  await boardRow.click()
  await expect(page.locator('.excalidraw canvas.interactive')).toBeVisible({ timeout: 20_000 })
  await expect(boardRow).toHaveAttribute('aria-current', 'page')

  // The right panel shows the board's referrers instead of the page metadata,
  // from both reference forms, and a row opens its page.
  const referencedBy = page
    .getByRole('complementary', { name: 'Page sidebar' })
    .locator('details')
    .filter({ has: page.locator('summary', { hasText: 'Referenced by' }) })
  await expect(referencedBy.getByRole('button', { name: 'Alpha', exact: true })).toBeVisible()
  await expect(referencedBy.getByRole('button', { name: 'Beta', exact: true })).toBeVisible()
  await expect(page.getByText('Contents')).toHaveCount(0)

  await referencedBy.getByRole('button', { name: 'Beta', exact: true }).click()
  await expect(editor(page)).toContainText('Also the plan:')
})

test('drawing on a board saves the drawing and nothing else', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Log.md': 'A log.',
    'boards/Plan.excalidraw': '{}',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await filesSection(page).getByRole('button', { name: 'Plan.excalidraw' }).click()

  const canvas = page.locator('.excalidraw canvas.interactive')
  await expect(canvas).toBeVisible({ timeout: 20_000 })
  const box = (await canvas.boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await page.mouse.click(cx, cy)
  await page.keyboard.press('r')
  await page.mouse.move(cx - 50, cy - 40)
  await page.mouse.down()
  await page.mouse.move(cx + 70, cy + 50, { steps: 8 })
  await page.mouse.up()

  // The board file takes the drawing, once the save settles: it is a scene, not
  // a page, and the element the pointer drew is in it.
  await expect
    .poll(
      () =>
        readVaultFile(page, 'boards/Plan.excalidraw').then((text) => {
          if (text === '') return []
          const scene = JSON.parse(text) as { elements?: { type: string }[] }
          return (scene.elements ?? []).map((el) => el.type)
        }),
      { timeout: 15_000 },
    )
    .toEqual(['rectangle'])

  // Nothing else in the folder changed.
  const files = (await listVaultFiles(page)).filter((path) => !path.startsWith('.folio/'))
  expect(files).toEqual(['boards/Plan.excalidraw', todayJournalPath(), 'pages/Log.md'])
})
