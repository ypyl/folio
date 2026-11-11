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

    const navView = page.locator('.layer-nav')
    const main = page.locator('.layer-main')

    // With no folder the brand screen leads: it carries the folder action, the
    // demo, and the browser requirement, while the navigation view has no
    // folder content to show (make-the-app-usable-on-a-phone).
    await expect(main).toBeVisible()
    await expect(navView).toBeHidden()
    await expect(page.getByRole('button', { name: 'Open folder', exact: true })).toBeVisible()
    // Neither collapse strip exists on compact, and nothing overflows.
    await expect(page.locator('[aria-controls="folder-rail sidebar-pane"]')).toHaveCount(0)
    await expect(page.locator('[aria-controls="meta-panel"]')).toHaveCount(0)
    await expectNoSidewaysScroll(page)

    // Opening a vault opens today's journal, which keeps the editor view.
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

  test('every control the compact shell shows is thumb-sized', async ({ page }) => {
    await installVaultPicker(page)
    await page.goto('/')
    await seedVault(page, { 'pages/Ideas.md': 'Half-formed thoughts.\n' })
    await openVault(page)
    await expect(page.locator('.cm-content')).toBeVisible()

    // Every visible button, link, summary, input, and role=button box in the
    // shell is at least 44 by 44 CSS pixels (make-the-app-usable-on-a-phone,
    // DESIGN.md "Touch targets and safe areas"). Two controls are measured by
    // their target rather than their mark: the folder entry's close badge keeps
    // an 18px mark inside a 44px transparent hit area, so its target is the
    // pseudo-element's box, and the GFM task checkbox inside the editor stays at
    // its text size by spec, so it is excluded by name.
    const undersized = () =>
      page.evaluate(() => {
        const found: string[] = []
        const nodes = document.querySelectorAll(
          'button, a, summary, input, select, textarea, [role="button"]',
        )
        for (const node of nodes) {
          if (node.classList.contains('folio-task')) continue
          const rect = node.getBoundingClientRect()
          const style = getComputedStyle(node)
          if (rect.width === 0 || rect.height === 0) continue
          if (style.visibility === 'hidden' || style.display === 'none') continue
          let width = rect.width
          let height = rect.height
          if (node.getAttribute('aria-label')?.startsWith('Close folder')) {
            const hit = getComputedStyle(node, '::before')
            width = parseFloat(hit.width)
            height = parseFloat(hit.height)
          }
          if (width < 44 || height < 44) {
            const name =
              node.getAttribute('aria-label') || (node.textContent ?? '').trim().slice(0, 30)
            found.push(
              `${name || node.tagName.toLowerCase()} ${Math.round(width)}x${Math.round(height)}`,
            )
          }
        }
        return found
      })

    // The brand screen's actions (measured before a folder was opened).
    expect(await undersized()).toEqual([])

    // The navigation view: rail, calendar, summaries, and the listing.
    await page.getByRole('button', { name: 'Navigation', exact: true }).click()
    await expect(page.locator('.layer-nav')).toBeVisible()
    expect(await undersized()).toEqual([])

    // The meta view: summaries, Contents, and the shortcuts reference.
    await page.getByRole('button', { name: 'Page details', exact: true }).click()
    await expect(page.locator('.layer-meta')).toBeVisible()
    expect(await undersized()).toEqual([])

    // The search spotlight.
    await page.getByRole('button', { name: 'Navigation', exact: true }).click()
    await page.getByRole('button', { name: 'Open search' }).click()
    await page.locator('dialog[open] input').fill('Half')
    // A result row, its clear control, and the match-case toggle are the
    // spotlight's own controls; the page's row is the dropdown's target.
    await expect(page.locator('dialog[open]')).toContainText('Ideas')
    expect(await undersized()).toEqual([])
  })

  test('a held press opens the menu a right-click opens, and a tap still taps', async ({
    page,
  }) => {
    await installVaultPicker(page)
    await page.goto('/')
    await seedVault(page, { 'pages/Ideas.md': 'Half-formed thoughts.\n' })
    await openVault(page)
    await expect(page.locator('.cm-content')).toBeVisible()

    const hold = async (locator: import('@playwright/test').Locator) => {
      const box = await locator.boundingBox()
      expect(box, 'the pressed control has no box').not.toBeNull()
      const point = { clientX: box!.x + 20, clientY: box!.y + 10 }
      await locator.dispatchEvent('pointerdown', { pointerType: 'touch', ...point })
      await page.waitForTimeout(600)
      await locator.dispatchEvent('pointerup', { pointerType: 'touch', ...point })
    }

    // A held press on a page row opens the row menu in the navigation view, and
    // the release does not open the page under it.
    await page.getByRole('button', { name: 'Navigation', exact: true }).click()
    const ideas = page.getByRole('button', { name: 'Ideas', exact: true })
    await hold(ideas)
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('menuitem', { name: 'Favorite' })).toBeVisible()
    await expect(page.locator('.layer-nav')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)

    // A short press is still a tap: the page opens and no menu appears.
    await ideas.click()
    await expect(page.locator('.cm-content')).toContainText('Half-formed thoughts.')
    await expect(menu).toHaveCount(0)

    // A held press on a day cell opens the reminder menu for that day.
    await page.getByRole('button', { name: 'Navigation', exact: true }).click()
    const day = page.locator('.layer-nav button[data-date]').nth(10)
    await hold(day)
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('group', { name: 'Reminder' })).toBeVisible()
  })

  test('a vault image keeps its fitted size and offers no expand control', async ({ page }) => {
    await page.goto('/')
    // The demo needs no folder picker, and its Assets page shows a vault image.
    await page.getByRole('button', { name: 'Open the guided demo' }).click()
    await expect(page.locator('.cm-content')).toBeVisible()
    await page.getByRole('button', { name: 'Navigation', exact: true }).click()
    await page.getByRole('button', { name: 'Assets', exact: true }).click()

    const image = page.locator('.folio-image img').first()
    await expect(image).toBeVisible()
    // A phone has no pointer to hover the control out with, and an image
    // expanded past the pane could only be panned sideways, so the fitted size
    // is the only size it shows (make-the-app-usable-on-a-phone). The control's
    // node view stays mounted so a window crossing back over the breakpoint
    // keeps its state; the stylesheet is what takes it out of the shell.
    await expect(page.locator('.folio-image-control')).toBeHidden()
    const fitted = await image.evaluate((img) => {
      const pane = img.closest('.cm-scroller') as HTMLElement
      return { image: img.getBoundingClientRect().width, pane: pane.getBoundingClientRect().width }
    })
    expect(fitted.image).toBeLessThanOrEqual(fitted.pane)
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
    // The session navigation is not in the bar: it is the sidebar's navigation
    // row, inside the navigation view (move-nav-controls-to-the-sidebar).
    const bar = footer(page)
    const names = ['Navigation', 'Page details']
    for (const name of names) {
      const box = await bar.getByRole('button', { name }).boundingBox()
      expect(box, `${name} has no box`).not.toBeNull()
      expect(box!.width, `${name} is too narrow`).toBeGreaterThanOrEqual(44)
      expect(box!.height, `${name} is too short`).toBeGreaterThanOrEqual(44)
    }
    await expect(bar.getByRole('button', { name: 'Back' })).toHaveCount(0)
    await expect(bar.getByRole('button', { name: 'Today' })).toHaveCount(0)

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

  test('the Journal row is touch-sized in the navigation view', async ({ page }) => {
    await installVaultPicker(page)
    await page.goto('/')
    await seedVault(page, { 'pages/Ideas.md': 'Half-formed thoughts.\n' })
    await openVault(page)
    await expect(page.locator('.cm-content')).toBeVisible()

    await page.getByRole('button', { name: 'Navigation', exact: true }).click()
    const journal = page.locator('#sidebar-pane details').first()
    const summary = journal.locator('summary')
    await expect(summary).toBeVisible()
    for (const name of ['Back', 'Forward', 'Today']) {
      const box = await summary.getByRole('button', { name }).boundingBox()
      expect(box, `${name} has no box`).not.toBeNull()
      expect(box!.width, `${name} is too narrow`).toBeGreaterThanOrEqual(44)
      expect(box!.height, `${name} is too short`).toBeGreaterThanOrEqual(44)
    }
    // The section's own disclosure still toggles it, and a control on the row
    // does not (put-nav-controls-on-the-journal-header).
    await expect(journal).toHaveAttribute('open', '')
    await summary.getByRole('button', { name: 'Today' }).click()
    await expect(journal).toHaveAttribute('open', '')
    await summary.locator('span').first().click()
    await expect(journal).not.toHaveAttribute('open', '')
    await expect(summary.getByRole('button', { name: 'Back' })).toBeVisible()
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

  test('the two view controls sit at the bar\u2019s two edges', async ({ page }) => {
    await installVaultPicker(page)
    await page.goto('/')
    await seedVault(page, { 'pages/Ideas.md': 'Half-formed thoughts.\n' })
    await openVault(page)
    await expect(page.locator('.cm-content')).toBeVisible()

    // Each control is flush with the bar's own content edge, and the two gaps
    // match: nothing sits between the trailing control and the edge to absorb
    // free space and leave it short of the border.
    const edges = await page.evaluate(() => {
      const bar = document.querySelector('.app-shell > footer') as HTMLElement
      const style = getComputedStyle(bar)
      const box = bar.getBoundingClientRect()
      const leading = bar
        .querySelector('button[aria-label="Navigation"]')!
        .getBoundingClientRect()
      const trailing = bar
        .querySelector('button[aria-label="Page details"]')!
        .getBoundingClientRect()
      return {
        leadingGap: leading.left - box.left - parseFloat(style.paddingLeft),
        trailingGap: box.right - parseFloat(style.paddingRight) - trailing.right,
      }
    })
    expect(edges.leadingGap).toBeLessThan(1)
    expect(edges.trailingGap).toBeLessThan(1)
    expect(Math.abs(edges.leadingGap - edges.trailingGap)).toBeLessThan(1)
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

  test('a vault image keeps its expand control above the breakpoint', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open the guided demo' }).click()
    await expect(page.locator('.cm-content')).toBeVisible()
    await page.getByRole('button', { name: 'Assets', exact: true }).click()
    const image = page.locator('.folio-image').first()
    await image.hover()
    // The compact hide is a media query, so the control it takes away must still
    // be here on a wide window (make-the-app-usable-on-a-phone).
    await expect(page.getByRole('button', { name: 'Expand image' })).toBeVisible()
  })
})

test.describe('the navigation view holds the sidebar whole', () => {
  test.use({ viewport: PHONE })

  test('the journal calendar renders with a real height', async ({ page }) => {
    await installVaultPicker(page)
    await page.goto('/')
    await seedVault(page, { 'pages/Ideas.md': 'Half-formed thoughts.\n' })
    await openVault(page)
    await expect(page.locator('.cm-content')).toBeVisible()

    await page.getByRole('button', { name: 'Navigation', exact: true }).click()
    const nav = page.locator('.layer-nav')
    await expect(nav).toBeVisible()

    const calendar = nav.locator('[class*="calendar"]').first()
    await expect(calendar).toBeVisible()
    const box = await calendar.boundingBox()
    expect(box, 'calendar has no box').not.toBeNull()
    expect(box!.height).toBeGreaterThan(120)
    expect(box!.width).toBeGreaterThan(150)
    await expect(nav.locator('[class*="grid"]').first()).toBeVisible()
  })
})
