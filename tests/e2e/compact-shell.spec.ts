import { expect, test, type Locator } from '@playwright/test'
import { installVaultPicker, openVault, seedVault, todayJournalPath } from './helpers/vault'

// add-compact-mobile-shell: the compact composition's layout is a media query
// over real CSS, so it can only be checked in a real browser. jsdom applies no
// stylesheets and has no layout; the app tests hold the state that drives the
// composition, and these hold what the stylesheet does with it.

/** A phone-sized window: narrower than the shell's breakpoint. */
const PHONE = { width: 390, height: 844 }

/** Nothing overflows the window sideways. The wide grid is 632px of fixed
 *  tracks, so a compact composition that failed to replace it shows up here as
 *  a horizontal scrollbar. */
async function expectNoSidewaysScroll(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    window: window.innerWidth,
  }))
  expect(overflow.document).toBeLessThanOrEqual(overflow.window + 1)
}

const footer = (page: import('@playwright/test').Page) => page.locator('.app-shell > footer')

test.describe('the compact shell on a phone-sized window', () => {
  test.use({ viewport: PHONE })

  test('shows one view at a time and no folded-width chrome', async ({ page }) => {
    await installVaultPicker(page)
    await page.goto('/')

    // With nothing open the navigation view leads, so a first run lands on the
    // folder picker's control.
    const navView = page.locator('.layer-nav')
    await expect(navView).toBeVisible()
    await expect(page.locator('.layer-main')).toBeHidden()
    // Neither collapse strip exists on compact, and nothing overflows.
    await expect(page.locator('[aria-controls="folder-rail sidebar-pane"]')).toHaveCount(0)
    await expect(page.locator('[aria-controls="meta-panel"]')).toHaveCount(0)
    await expectNoSidewaysScroll(page)

    // Opening a vault opens today's journal, which returns the editor view.
    await seedVault(page, { 'pages/Ideas.md': 'Half-formed thoughts.\n' })
    await openVault(page)
    await expect(page.locator('.cm-content')).toBeVisible()
    await expect(navView).toBeHidden()
    await expectNoSidewaysScroll(page)
    await expect(page.locator('.cm-content')).toContainText('')
    expect(await page.locator('.cm-content').count()).toBeGreaterThan(0)
    void todayJournalPath()

    // The app bar's meta control shows the right panel over the editor.
    await page.getByRole('button', { name: 'Page details', exact: true }).click()
    await expect(page.locator('.layer-meta')).toBeVisible()
    await expect(page.locator('.cm-content')).toBeHidden()

    // The shown view's own control gives way to the editor.
    await page.getByRole('button', { name: 'Page details', exact: true }).click()
    await expect(page.locator('.cm-content')).toBeVisible()
    await expect(page.locator('.layer-meta')).toBeHidden()

    // The navigation view covers the editor; a row opens its page in the editor.
    await page.getByRole('button', { name: 'Navigation', exact: true }).click()
    await expect(navView).toBeVisible()
    await page.getByRole('button', { name: 'Ideas', exact: true }).click()
    await expect(page.locator('.cm-content')).toContainText('Half-formed thoughts.')
    await expect(navView).toBeHidden()
  })

  test('the browser back step closes a view instead of leaving the app', async ({ page }) => {
    await installVaultPicker(page)
    await page.goto('/')
    await seedVault(page, { 'pages/Ideas.md': 'Half-formed thoughts.\n' })
    await openVault(page)
    await expect(page.locator('.cm-content')).toBeVisible()

    await page.getByRole('button', { name: 'Navigation', exact: true }).click()
    await expect(page.locator('.layer-nav')).toBeVisible()

    await page.goBack()
    await expect(page.locator('.layer-nav')).toBeHidden()
    await expect(page.locator('.cm-content')).toBeVisible()
    // Still in the app, not on a blank page: the entry was the view's.
    expect(page.url()).toContain('/')
  })

  test('the app bar is touch-sized and drops what a phone-width row cannot hold', async ({
    page,
  }) => {
    await installVaultPicker(page)
    await page.goto('/')
    await seedVault(page, { 'pages/Ideas.md': 'Half-formed thoughts.\n' })
    await openVault(page)
    await expect(page.locator('.cm-content')).toBeVisible()

    // Every control in the bar is at least 44 by 44, view controls included.
    const bar = footer(page)
    const names = ['Navigation', 'Back', 'Forward', 'Today', 'Page details']
    for (const name of names) {
      const box = await bar.getByRole('button', { name }).boundingBox()
      expect(box, `${name} has no box`).not.toBeNull()
      expect(box!.width, `${name} is too narrow`).toBeGreaterThanOrEqual(44)
      expect(box!.height, `${name} is too short`).toBeGreaterThanOrEqual(44)
    }

    // The open item's name shows; the directories, the folder statistics, and
    // the version do not.
    await expect(bar).toContainText(todayJournalPath().split('/')[1]!)
    await expect(bar).not.toContainText('journals/')
    await expect(bar).not.toContainText('v0.')
    await expect(bar.locator('[class*="vaultStatus"]')).toHaveCount(0)
    // One row: the bar does not wrap or scroll.
    const row = await bar.evaluate((el) => ({
      height: el.getBoundingClientRect().height,
      scroll: el.scrollWidth,
      client: el.clientWidth,
    }))
    expect(row.scroll).toBeLessThanOrEqual(row.client + 1)
    expect(row.height).toBeLessThan(70)
  })

  test('the bar marks the open view by shape and tint', async ({ page }) => {
    await installVaultPicker(page)
    await page.goto('/')
    await seedVault(page, { 'pages/Ideas.md': 'Half-formed thoughts.\n' })
    await openVault(page)
    await expect(page.locator('.cm-content')).toBeVisible()

    const bar = footer(page)
    const nav = bar.getByRole('button', { name: 'Navigation', exact: true })
    const meta = bar.getByRole('button', { name: 'Page details', exact: true })

    // What the control draws and what it reports, read from the real stylesheet
    // and the real SVG: jsdom applies neither.
    const painted = (control: Locator) =>
      control.evaluate((el) => ({
        tint: getComputedStyle(el).backgroundColor,
        panes: el.querySelectorAll('svg path[fill="currentColor"]').length,
        pressed: el.getAttribute('aria-pressed'),
      }))

    // The editor view belongs to neither control, so both are closed: an empty
    // pane on no tint.
    expect(await painted(nav)).toEqual({ tint: 'rgba(0, 0, 0, 0)', panes: 0, pressed: 'false' })
    expect(await painted(meta)).toEqual({ tint: 'rgba(0, 0, 0, 0)', panes: 0, pressed: 'false' })

    await nav.click()
    expect(await painted(nav)).toEqual({ tint: 'rgb(238, 242, 247)', panes: 1, pressed: 'true' })
    expect(await painted(meta)).toEqual({ tint: 'rgba(0, 0, 0, 0)', panes: 0, pressed: 'false' })

    // The tint is keyed to the state, not the pointer: hovering a closed control
    // does not make it look open.
    await meta.hover()
    expect((await painted(meta)).tint).toBe('rgba(0, 0, 0, 0)')

    await meta.click()
    expect(await painted(meta)).toEqual({ tint: 'rgb(238, 242, 247)', panes: 1, pressed: 'true' })
    expect(await painted(nav)).toEqual({ tint: 'rgba(0, 0, 0, 0)', panes: 0, pressed: 'false' })
  })
})

test.describe('the wide composition is unchanged', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('keeps both strips, both panes, and no view controls', async ({ page }) => {
    await installVaultPicker(page)
    await page.goto('/')
    await seedVault(page, { 'pages/Ideas.md': 'Half-formed thoughts.\n' })
    await openVault(page)
    await expect(page.locator('.cm-content')).toBeVisible()

    // No view class, no view controls: the compact shell is not in play.
    await expect(page.locator('.app-shell')).not.toHaveAttribute('class', /view-/)
    await expect(page.getByRole('button', { name: 'Navigation', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Page details', exact: true })).toHaveCount(0)

    // Both panes are laid out beside the editor, and both strips fold them.
    const rail = page.locator('.layer-nav > *').first()
    await expect(rail).toBeVisible()
    await expect(page.locator('.layer-meta > *')).toBeVisible()
    const strip = page.locator('[aria-controls="folder-rail sidebar-pane"]')
    await expect(strip).toBeVisible()
    await strip.click()
    await expect(rail).toBeHidden()
    await expect(page.locator('[aria-controls="folder-rail sidebar-pane"]')).toBeVisible()

    // The wide bar keeps the version and the folder statistics.
    await expect(footer(page)).toContainText('v0.')
  })
})
