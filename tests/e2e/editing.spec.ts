import { expect, test } from '@playwright/test'
import { editor, installVaultPicker, openVault, seedVault } from './helpers/vault'

// openspec/specs/editing: the open page is edited in place and autosaves to the
// vault folder.
test('editing a page autosaves it to the vault', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, { 'pages/Welcome.md': 'Draft one.' })
  await openVault(page)

  await page.getByRole('button', { name: 'Welcome' }).click()
  await editor(page).click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type(' Edited.')
  await expect(editor(page)).toContainText('Draft one. Edited.')

  // The edit shows unsaved, then the debounced save clears the indicator.
  await expect(page.getByText('Unsaved changes')).toBeVisible()
  await expect(page.getByText('Unsaved changes')).toHaveCount(0, { timeout: 5000 })

  // Reload and reopen: the edit reached the file.
  await page.reload()
  await page.getByRole('button', { name: 'Welcome' }).click()
  await expect(editor(page)).toContainText('Draft one. Edited.')
})

// openspec/specs/editing: typing a reference offers matching pages, and never
// inside code.
test('typing a reference completes a page and stays out of code', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Welcome.md': 'Start here.',
    'pages/Reading.md': 'A page about reading.',
  })
  await openVault(page)

  await page.getByRole('button', { name: 'Welcome' }).click()
  await editor(page).click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type(' #rea')

  const popup = page.locator('.cm-tooltip-autocomplete')
  await expect(popup).toBeVisible()
  await expect(popup.getByRole('option', { name: 'Reading' })).toBeVisible()

  // The popup is the app's own chrome, not CodeMirror's stock tooltip
  // (style-completion-popup): the surface is the ivory token and the active row
  // is the app's warm interactive fill, not the library's `#17c`. The selector
  // above is what the styling hangs on, so a CodeMirror upgrade that renames it
  // fails here instead of silently reverting the popup.
  await expect
    .poll(() => popup.evaluate((el) => getComputedStyle(el).backgroundColor))
    .toBe('rgb(250, 249, 245)'); // --ivory
  await expect
    .poll(() => popup.locator('li[aria-selected]').first().evaluate((el) => getComputedStyle(el).backgroundColor))
    .toBe('rgb(232, 230, 220)'); // --warm-sand

  // Enter accepts the active (first) row; the popup ignores keys for a beat
  // after it opens, so let it settle first.
  await page.waitForTimeout(200)
  await page.keyboard.press('Enter')
  await expect(editor(page)).toContainText('#Reading')

  // The same prefix inside a fenced block opens nothing.
  await page.keyboard.press('Control+End')
  await page.keyboard.type('\n```\n#rea')
  await page.waitForTimeout(400)
  await expect(page.locator('.cm-tooltip-autocomplete')).toHaveCount(0)
})

// openspec/specs/editing: the located frames are dismissed with Escape, but the
// spotlight keeps the key while it is open (dismiss-located-block-frames).
test('Escape dismisses the located frames', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, { 'pages/Notes.md': '# dog\n\nBody dog\n\nMore dog\n' })
  await openVault(page)
  await expect(page.getByRole('button', { name: 'Notes' })).toBeVisible()

  await page.keyboard.press('Control+k')
  await page.getByRole('textbox', { name: 'Search notes' }).fill('dog')
  await page.getByRole('option', { name: /Notes/ }).click()

  // Every matching block is framed, one line each.
  const frames = page.locator('.folio-search-hit')
  await expect(frames).toHaveCount(3)

  // The spotlight claims Escape first: reopening and dismissing it leaves the
  // frames in place.
  await page.keyboard.press('Control+k')
  const spotlight = page.getByRole('textbox', { name: 'Search notes' })
  await expect(spotlight).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(spotlight).not.toBeVisible()
  await expect(frames).toHaveCount(3)

  // With nothing else claiming the key, Escape clears the frames.
  await page.keyboard.press('Escape')
  await expect(frames).toHaveCount(0)
})

// openspec/specs/editing: a vault image resolves as it scrolls into view
// (render-vault-images, ADR-0028). CodeMirror mounts an image's element only
// when it enters the viewport, so the pane must re-register images on a render
// with no document change; without that, a scrolled-to image keeps its raw
// vault path and shows as broken.
test('a vault image resolves as it scrolls into view', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory()
    for await (const [name] of root.entries()) await root.removeEntry(name, { recursive: true })
    const assets = await root.getDirectoryHandle('assets', { create: true })
    const pages = await root.getDirectoryHandle('pages', { create: true })

    const png = await new Promise<Uint8Array>((resolve) => {
      const canvas = document.createElement('canvas')
      canvas.width = 8
      canvas.height = 8
      canvas.getContext('2d')!.fillRect(0, 0, 8, 8)
      canvas.toBlob(async (blob) => resolve(new Uint8Array(await blob!.arrayBuffer())), 'image/png')
    })

    let body = ''
    for (let i = 0; i < 15; i++) {
      const file = await assets.getFileHandle(`shot-${i}.png`, { create: true })
      const writable = await file.createWritable()
      await writable.write(png)
      await writable.close()
      // Tall filler so each image sits a screen apart.
      body += `\n\n![shot ${i}](assets/shot-${i}.png)\n\n${'filler\n'.repeat(30)}`
    }
    const pageFile = await pages.getFileHandle('Shots.md', { create: true })
    const writable = await pageFile.createWritable()
    await writable.write(body)
    await writable.close()
  })
  await openVault(page)
  await page.getByRole('button', { name: 'Shots' }).click()

  // Every image the editor mounts while scrolling shows vault bytes, not the
  // path the browser cannot fetch. Resolution is async, so wait for the mounted
  // set to settle instead of sampling the moment the scroll returns.
  const pane = page.locator('main')
  for (let step = 0; step < 5; step++) {
    await pane.evaluate((el) => el.scrollBy(0, 900))
    await expect
      .poll(
        async () => {
          const sources = await page
            .locator('.folio-image img')
            .evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src') ?? ''))
          return sources.length > 0 && sources.every((src) => src.startsWith('blob:'))
        },
        { message: 'every mounted vault image resolves to a blob URL' },
      )
      .toBe(true)
  }
})

// openspec/specs/editing: a drag across code is visible. The editor paints the
// selection into a layer of its own, and a code surface (a block's panel, an
// inline pill) is an opaque fill over the text, so a layer behind the content
// left the selection hidden there. The theme lifts it above the text and
// multiplies it in, which is what this pins.
test('a selection inside a code block is visible', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, { 'pages/Notes.md': 'Above.\n\n```js\nconst a = 1\n```\n' })
  await openVault(page)
  await page.getByRole('button', { name: 'Notes' }).click()

  const codeLine = page.locator('.folio-cm-code', { hasText: 'const a = 1' })
  await codeLine.click()
  await page.keyboard.press('Home')
  await page.keyboard.press('Shift+End')

  const layer = page.locator('.cm-selectionLayer')
  await expect(layer).toHaveCount(1)
  await expect
    .poll(() => layer.evaluate((el) => getComputedStyle(el).mixBlendMode))
    .toBe('multiply')
  await expect
    .poll(() => layer.evaluate((el) => getComputedStyle(el).zIndex))
    .toBe('2')
})
