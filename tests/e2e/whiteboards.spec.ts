import { expect, test } from '@playwright/test'
import { installVaultPicker, openVault, seedVault } from './helpers/vault'

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
