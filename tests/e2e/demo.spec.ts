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

  // The browser requirement is a warning card, and the demo is the one action
  // it leaves.
  await expect(page.getByText('Chrome, Edge, or Brave required')).toBeVisible()
  await expect(page.getByText(/You can still open the guided demo/)).toBeVisible()
  await page.getByRole('button', { name: 'Open the guided demo' }).click()

  const editor = page.locator('.cm-content')
  await expect(editor).toContainText('Welcome to the Folio demo')
  await expect(editor).toContainText('## Table of contents')
  await expect(page.getByRole('button', { name: 'Open the demo vault' })).toBeVisible()
  await expect(page.getByText('Demo vault')).toBeVisible()

  // The session-only rule is a visible notice that stays while the page
  // scrolls, not a paragraph a reader can scroll past.
  const notice = page.getByText(
    'Changes last for this session and are never saved to your disk.',
  )
  await expect(notice).toBeVisible()
  const pane = page.locator('[data-tour="editor"]')
  await pane.evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })
  await expect(notice).toBeVisible()
  const paneBox = (await pane.boundingBox())!
  const noticeBox = (await notice.boundingBox())!
  expect(noticeBox.y).toBeLessThan(paneBox.y + 60)
  await pane.evaluate((el) => {
    el.scrollTop = 0
  })

  // The guide's table of contents is made of live reference badges.
  await editor.getByText('#References', { exact: true }).first().click()
  await expect(editor).toContainText('A reference is how one page names another')
  // A deliberately missing name is still a working reference.
  await editor.getByText('#missing-topic', { exact: true }).click()
  await expect(page.getByTitle('pages/missing-topic.md')).toBeVisible()

  // Bring the guide back from the blank page and open its chapters through
  // their reference badges, so the demo needs no outside content.
  const files = page.locator('#sidebar-pane')
  await files.getByRole('button', { name: 'Welcome' }).click()
  await expect(editor).toContainText('## Table of contents')
  await editor.getByText('#Assets', { exact: true }).click()
  await expect(editor).toContainText('An image from the vault')
  await expect(page.locator('.folio-image[data-resolved] img')).toBeVisible()

  // Back to the Welcome page, then into the board chapter.
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(editor).toContainText('## Table of contents')
  await editor.getByText('#Boards', { exact: true }).first().click()
  await expect(editor).toContainText('Open the demo board')
  await editor.getByText('#![[How Folio works]]', { exact: true }).click()
  await expect(page.locator('.excalidraw canvas.interactive')).toBeVisible({ timeout: 20_000 })

  // Files covers every kind: scroll its own body to the end so the board and
  // asset rows enter the window, then read them.
  const fileList = files.getByRole('list').last()
  await fileList.evaluate((el) => {
    const body = el.parentElement as HTMLElement
    body.scrollTop = body.scrollHeight
  })
  await expect(files.getByRole('button', { name: 'How Folio works' })).toBeVisible()
  await expect(files.getByRole('button', { name: 'folio-flow.svg' })).toBeVisible()

  // Today opens the demo's own day and writes its due reminders into it.
  await page.getByRole('button', { name: 'Today' }).click()
  await expect(editor).toContainText('Water the plants')
  await expect(editor).toContainText('Weekly review')

  // The demo is session-only: a reload does not restore it.
  await page.reload()
  await expect(page.getByText(/You can still open the guided demo/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Open the demo vault' })).toHaveCount(0)
})
