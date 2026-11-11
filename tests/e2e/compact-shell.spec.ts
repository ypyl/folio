import { expect, test } from '@playwright/test'
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

    // The Details destination shows the right panel over the editor.
    await page.getByRole('button', { name: 'Details', exact: true }).click()
    await expect(page.locator('.layer-meta')).toBeVisible()
    await expect(page.locator('.cm-content')).toBeHidden()

    // The Page destination returns to the editor.
    await page.getByRole('button', { name: 'Page', exact: true }).click()
    await expect(page.locator('.cm-content')).toBeVisible()
    await expect(page.locator('.layer-meta')).toBeHidden()

    // The Notes destination covers the editor; a row opens its page.
    await page.getByRole('button', { name: 'Notes', exact: true }).click()
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
    // shell is at least 48 by 48 CSS pixels (make-the-phone-read-like-an-app,
    // DESIGN.md "Touch targets and safe areas"). Two controls are measured
    // differently: the folder entry's close badge keeps an 18px mark inside a
    // 48px transparent hit area, so its target is the pseudo-element's box; and
    // a calendar day cell is 48 tall but takes its seven-column share, so its
    // width only has to clear the 44px floor. The GFM task checkbox inside the
    // editor stays at its text size by spec, so it is excluded by name.
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
          const minWidth = node.hasAttribute('data-date') ? 44 : 48
          if (width < minWidth || height < 48) {
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
    await page.getByRole('button', { name: 'Notes', exact: true }).click()
    await expect(page.locator('.layer-nav')).toBeVisible()
    expect(await undersized()).toEqual([])

    // The meta view: summaries, Contents, and the shortcuts reference.
    await page.getByRole('button', { name: 'Details', exact: true }).click()
    await expect(page.locator('.layer-meta')).toBeVisible()
    expect(await undersized()).toEqual([])

    // The search spotlight.
    await page.getByRole('button', { name: 'Notes', exact: true }).click()
    await page.getByRole('button', { name: 'Open search' }).click()
    await page.locator('dialog[open] input').fill('Half')
    // A result row, its clear control, and the match-case toggle are the
    // spotlight's own controls; the page's row is the dropdown's target.
    await expect(page.locator('dialog[open]')).toContainText('Ideas')
    expect(await undersized()).toEqual([])
  })

  test('the app bar names the open view and carries its page actions', async ({ page }) => {
    await installVaultPicker(page)
    await page.goto('/')
    await seedVault(page, { 'pages/Ideas.md': 'Half-formed thoughts.\n' })
    await openVault(page)
    await expect(page.locator('.cm-content')).toBeVisible()

    // Open a page from the list and read its name in the app bar.
    await page.getByRole('button', { name: 'Notes', exact: true }).click()
    await page.getByRole('button', { name: 'Ideas', exact: true }).click()
    await expect(page.locator('.cm-content')).toContainText('Half-formed thoughts.')
    const appBar = page.locator('.workspace header')
    await expect(appBar).toContainText('Ideas')

    // The page's row actions are the bar's trailing control.
    await page.getByRole('button', { name: 'Page actions' }).click()
    await expect(page.getByRole('menuitem', { name: 'Favorite' })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: 'Present' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
  })

  test('the compact shell uses the phone type scale', async ({ page }) => {
    await installVaultPicker(page)
    await page.goto('/')
    await seedVault(page, { 'pages/Ideas.md': 'Half-formed thoughts.\n' })
    await openVault(page)
    await expect(page.locator('.cm-content')).toBeVisible()

    const fontOf = (selector: string) =>
      page.evaluate((sel) => {
        const el = document.querySelector(sel)
        return el ? getComputedStyle(el).fontSize : null
      }, selector)

    // The editor and the app bar title are the reading scale (enlarge-the-phone-
    // text); the app bar's first child is its title.
    expect(await fontOf('.cm-content')).toBe('18px')
    expect(await fontOf('.workspace header > div > :first-child')).toBe('18px')

    // The navigation view's labels follow the same scale.
    await page.getByRole('button', { name: 'Notes', exact: true }).click()
    await expect(page.locator('.layer-nav')).toBeVisible()
    expect(await fontOf('#sidebar-pane summary')).toBe('13px')
    expect(await fontOf('#sidebar-pane button[class*="row"]')).toBe('17px')
    expect(await fontOf('.layer-nav button[data-date]')).toBe('16px')
  })

  test('the manifest offers the app screens and an id for the install dialog', async ({
    page,
    request,
  }) => {
    await page.goto('/')
    const response = await request.get('/manifest.webmanifest')
    expect(response.ok()).toBe(true)
    const manifest = await response.json()
    expect(manifest.id).toBeTruthy()
    expect(manifest.categories).toContain('productivity')
    expect(manifest.screenshots).toHaveLength(2)
    for (const shot of manifest.screenshots) {
      expect(shot.form_factor).toBe('narrow')
      const image = await request.get(new URL(shot.src, response.url()).toString())
      expect(image.ok(), `${shot.src} should exist`).toBe(true)
    }
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
    await page.getByRole('button', { name: 'Notes', exact: true }).click()
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
    await page.getByRole('button', { name: 'Notes', exact: true }).click()
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
    await page.getByRole('button', { name: 'Notes', exact: true }).click()
    // The demo's listing is longer than the shorter compact viewport; scroll it
    // so the windowed listing renders the row before clicking it.
    await page
      .locator('#sidebar-pane [class*="scrollBody"]')
      .evaluate((el) => el.scrollTo(0, el.scrollHeight))
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

    await page.getByRole('button', { name: 'Notes', exact: true }).click()
    await expect(page.locator('.layer-nav')).toBeVisible()

    await page.goBack()
    await expect(page.locator('.layer-nav')).toBeHidden()
    await expect(page.locator('.cm-content')).toBeVisible()
    // Still in the app, not on a blank page: the entry was the view's.
    expect(page.url()).toContain('/')
  })

  test('the navigation bar is touch-sized and carries only its destinations', async ({
    page,
  }) => {
    await installVaultPicker(page)
    await page.goto('/')
    await seedVault(page, { 'pages/Ideas.md': 'Half-formed thoughts.\n' })
    await openVault(page)
    await expect(page.locator('.cm-content')).toBeVisible()

    // Every destination is at least 48 by 48, and each is its third of the bar.
    const bar = footer(page)
    for (const name of ['Notes', 'Page', 'Details']) {
      const control = bar.getByRole('button', { name, exact: true })
      const box = await control.boundingBox()
      expect(box, `${name} has no box`).not.toBeNull()
      expect(box!.width, `${name} is too narrow`).toBeGreaterThanOrEqual(48)
      expect(box!.height, `${name} is too short`).toBeGreaterThanOrEqual(48)
    }
    await expect(bar.getByRole('button', { name: 'Back' })).toHaveCount(0)
    await expect(bar.getByRole('button', { name: 'Today' })).toHaveCount(0)

    // The app bar names the open item; the navigation bar carries no status,
    // folder statistics, or version.
    const appBar = page.locator('.workspace header')
    await expect(appBar).toContainText(todayJournalPath().split('/')[1]!.replace(/\.md$/, ''))
    await expect(bar).not.toContainText(todayJournalPath().split('/')[1]!)
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
    const navView = (p: import('@playwright/test').Page) => p.locator('.layer-nav')
    await installVaultPicker(page)
    await page.goto('/')
    await seedVault(page, { 'pages/Ideas.md': 'Half-formed thoughts.\n' })
    await openVault(page)
    await expect(page.locator('.cm-content')).toBeVisible()

    await page.getByRole('button', { name: 'Notes', exact: true }).click()
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
    // Today opens the day, so the editor view takes over; come back to the list
    // to check that the summary's own label is still what toggles it.
    await page.getByRole('button', { name: 'Notes', exact: true }).click()
    await expect(navView(page)).toBeVisible()
    await summary.locator('span').first().click()
    await expect(journal).not.toHaveAttribute('open', '')
    await expect(summary.getByRole('button', { name: 'Back' })).toBeVisible()
  })

  test('the navigation bar marks the shown destination by its indicator', async ({ page }) => {
    await installVaultPicker(page)
    await page.goto('/')
    await seedVault(page, { 'pages/Ideas.md': 'Half-formed thoughts.\n' })
    await openVault(page)
    await expect(page.locator('.cm-content')).toBeVisible()

    const bar = footer(page)
    const destination = (name: string) => bar.getByRole('button', { name, exact: true })
    // The indicator is the first child: its tint is the drawn state.
    const painted = (name: string) =>
      destination(name).evaluate((el) => {
        const indicator = el.firstElementChild as HTMLElement
        return {
          background: getComputedStyle(indicator).backgroundColor,
          current: el.getAttribute('aria-current'),
        }
      })

    // The editor view is shown, so Page is the marked destination.
    expect(await painted('Page')).toEqual({
      background: 'rgb(238, 242, 247)',
      current: 'page',
    })
    expect((await painted('Notes')).current).toBeNull()
    expect((await painted('Details')).background).toBe('rgba(0, 0, 0, 0)')

    await destination('Notes').click()
    expect(await painted('Notes')).toEqual({
      background: 'rgb(238, 242, 247)',
      current: 'page',
    })
    expect((await painted('Page')).current).toBeNull()

    // The tint is keyed to the state, not the pointer.
    await destination('Details').hover()
    expect((await painted('Details')).background).toBe('rgba(0, 0, 0, 0)')

    await destination('Details').click()
    expect(await painted('Details')).toEqual({
      background: 'rgb(238, 242, 247)',
      current: 'page',
    })
    expect((await painted('Notes')).current).toBeNull()
  })

  test('the three destinations split the bar into equal thirds', async ({ page }) => {
    await installVaultPicker(page)
    await page.goto('/')
    await seedVault(page, { 'pages/Ideas.md': 'Half-formed thoughts.\n' })
    await openVault(page)
    await expect(page.locator('.cm-content')).toBeVisible()

    const boxes = await footer(page)
      .locator('nav button')
      .evaluateAll((buttons) =>
        buttons.map((el) => {
          const rect = el.getBoundingClientRect()
          return { left: rect.left, width: rect.width, height: rect.height }
        }),
      )
    expect(boxes).toHaveLength(3)
    // Same width within a pixel, edge to edge, and the bar's full 64px height.
    expect(
      Math.max(...boxes.map((b) => b.width)) - Math.min(...boxes.map((b) => b.width)),
    ).toBeLessThan(1)
    expect(boxes[1].left - boxes[0].left).toBeCloseTo(boxes[0].width, 0)
    expect(boxes[2].left - boxes[1].left).toBeCloseTo(boxes[1].width, 0)
    expect(boxes.every((b) => b.height === 64)).toBe(true)
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
    for (const name of ['Notes', 'Page', 'Details']) {
      await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0)
    }

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

    await page.getByRole('button', { name: 'Notes', exact: true }).click()
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
