import { expect, test } from '@playwright/test'

// openspec/specs/demo: the guided demo is a virtual vault, so it opens even
// where local folders cannot. Every check below runs with the File System
// Access API removed, which is Firefox and Safari's situation.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: undefined,
    })
  })
})

test('the guided demo opens without a folder picker and demonstrates every feature', async ({
  page,
}) => {
  await page.goto('/')

  // The browser requirement stands, and the demo is the one action it leaves.
  await expect(page.getByText(/You can still open the guided demo/)).toBeVisible()
  await page.getByRole('button', { name: 'Open the guided demo' }).click()

  const editor = page.locator('.cm-content')
  await expect(editor).toContainText('Welcome to the Folio demo')
  await expect(editor).toContainText('## Table of contents')
  await expect(page.getByRole('button', { name: 'Open the demo vault' })).toBeVisible()
  await expect(page.getByText('Demo vault')).toBeVisible()

  // The guide's table of contents is made of live reference badges.
  await editor.getByText('#References', { exact: true }).first().click()
  await expect(editor).toContainText('A reference is how one page names another')
  // A deliberately missing name is still a working reference.
  await editor.getByText('#missing-topic', { exact: true }).click()
  await expect(page.getByTitle('pages/missing-topic.md')).toBeVisible()

  // Files lists the demo's pages, its board, and its assets.
  const files = page.locator('#sidebar-pane')
  await expect(files.getByRole('button', { name: 'Boards' })).toBeVisible()
  await expect(files.getByRole('button', { name: 'How Folio works' })).toBeVisible()
  await expect(files.getByRole('button', { name: 'folio-flow.svg' })).toBeVisible()

  // The image on the Assets page resolves from the demo's own storage.
  await files.getByRole('button', { name: 'Assets' }).click()
  await expect(editor).toContainText('An image from the vault')
  await expect(page.locator('.folio-image[data-resolved] img')).toBeVisible()

  // The board reference opens the real Excalidraw surface.
  await files.getByRole('button', { name: 'Boards' }).click()
  await expect(editor).toContainText('Open the demo board')
  await editor.getByText('#![[How Folio works]]', { exact: true }).click()
  await expect(page.locator('.excalidraw canvas.interactive')).toBeVisible()

  // Today opens the demo's own day and writes its due reminders into it.
  await page.getByRole('button', { name: 'Today' }).click()
  await expect(editor).toContainText('Water the plants')
  await expect(editor).toContainText('Weekly review')

  // The demo is session-only: a reload does not restore it.
  await page.reload()
  await expect(page.getByText(/You can still open the guided demo/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open the demo vault' })).toHaveCount(0)
})
