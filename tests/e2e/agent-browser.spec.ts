import { chromium, expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// The one check against a real model-context interface (add-webmcp-tools, task
// 4.3). Everything else drives the fake; this runs the app's own registration
// path against the interface Chromium actually exposes, with the method wrapped
// before the app loads so what it registered is observable. A browser without the
// interface skips, because the trial is Chrome's and the surface is a no-op
// everywhere else.
//
// The preview in Playwright's Chromium keeps it on `navigator`; the origin trial
// moved it to `document`. The app reads both, so this test is the evidence that
// the shape it reads is a real one.
test('the app registers its tools with the browser’s own model context', async () => {
  const browser = await chromium.launch({ args: ['--enable-features=WebMCP'] })
  try {
    const page: Page = await browser.newPage()
    const baseURL = test.info().project.use.baseURL as string
    await page.addInitScript(() => {
      const target = (navigator as unknown as { modelContext?: Record<string, unknown> })
        .modelContext
      if (!target || typeof target.registerTool !== 'function') return
      const original = (target.registerTool as (tool: unknown, options: unknown) => unknown).bind(
        target,
      )
      const seen: string[] = []
      const retired: string[] = []
      target.registerTool = (tool: unknown, options: unknown) => {
        const name = (tool as { name: string }).name
        seen.push(name)
        // The app retires the surface by aborting the controller the
        // registrations were made under; recording that is what makes the
        // teardown observable on a build with no way to list tools.
        const signal = (options as { signal?: AbortSignal } | undefined)?.signal
        signal?.addEventListener('abort', () => retired.push(name))
        return original(tool, options)
      }
      Object.defineProperty(window, '__registered', { configurable: true, value: seen })
      Object.defineProperty(window, '__retired', { configurable: true, value: retired })
    })
    await page.goto(baseURL)
    await page.getByRole('button', { name: 'Open the guided demo' }).waitFor()

    const hasApi = await page.evaluate(() => {
      const nav = (navigator as unknown as { modelContext?: { registerTool?: unknown } })
        .modelContext
      const doc = (document as unknown as { modelContext?: { registerTool?: unknown } })
        .modelContext
      return typeof nav?.registerTool === 'function' || typeof doc?.registerTool === 'function'
    })
    test.skip(!hasApi, 'this browser build exposes no model-context interface')

    // Gate off: the app registered nothing with the browser's own interface.
    expect(
      await page.evaluate(() => (window as unknown as { __registered: string[] }).__registered),
    ).toEqual([])

    await page
      .locator('#folder-rail')
      .getByRole('button', { name: 'Experimental features' })
      .click()

    await expect
      .poll(async () =>
        page.evaluate(() => (window as unknown as { __registered: string[] }).__registered.length),
      )
      .toBe(9)
    expect(
      await page.evaluate(() => (window as unknown as { __registered: string[] }).__registered),
    ).toEqual([
      'search_notes',
      'read_note',
      'note_links',
      'app_state',
      'open_note',
      'create_note',
      'edit_note',
      'append_note',
      'add_reminder',
    ])

    // Turning the switch off retires the surface: the app aborts the controller
    // the registrations were made under, so the browser drops every tool.
    await page
      .locator('#folder-rail')
      .getByRole('button', { name: 'Experimental features' })
      .click()
    await expect
      .poll(async () =>
        page.evaluate(() => (window as unknown as { __retired: string[] }).__retired.length),
      )
      .toBe(9)
  } finally {
    await browser.close()
  }
})
