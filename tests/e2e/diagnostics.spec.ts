import { expect, test, type Page } from '@playwright/test'
import { editor, installVaultPicker, openVault, seedVault } from './helpers/vault'

// add-session-trace-logs: the experimental switch on the folder rail turns the
// session trace on without a rebuild, and the session's file lands in the vault
// itself. The e2e build sets `VITE_TRACE=1`, so the engine is exercised while
// the shipped build keeps it off (playwright.config.ts).

/** Every trace line the vault holds, across sessions. `''` while none exists. */
async function readTrace(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const root = await navigator.storage.getDirectory()
    try {
      const folio = await root.getDirectoryHandle('.folio')
      const logs = await folio.getDirectoryHandle('logs')
      let text = ''
      for await (const [name, handle] of logs.entries()) {
        if (handle.kind === 'file' && name.endsWith('.log')) {
          text += await (await handle.getFile()).text()
        }
      }
      return text
    } catch {
      return ''
    }
  })
}

test('records a session of edits in the vault', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, { 'pages/Ana.md': 'Ana\n' })
  await openVault(page)

  // The switch is off in a shipped build; turning it on needs no reload.
  const control = page.getByRole('button', { name: 'Experimental features' })
  await expect(control).toHaveAttribute('aria-pressed', 'false')
  await control.click()
  await expect(control).toHaveAttribute('aria-pressed', 'true')

  const files = page.locator('details', {
    has: page.locator('summary', { hasText: 'Files' }),
  })
  await files.getByRole('button', { name: 'Ana', exact: true }).click()
  await editor(page).click()
  await page.keyboard.type(' secretphrase')

  // The page save and then the trace's own debounce both land asynchronously.
  await expect
    .poll(() => readTrace(page), { timeout: 15_000 })
    .toContain('write {"path":"pages/Ana.md"')

  const trace = await readTrace(page)
  expect(trace).toContain('session-start')
  expect(trace).toContain('page-open {"path":"pages/Ana.md"')
  expect(trace).toContain('edit {"path":"pages/Ana.md"')
  expect(trace).toContain('scan {')
  // The trace is names and sizes, never the text itself.
  expect(trace).not.toContain('secretphrase')

  // One file per session, named for its start, in the folder it describes.
  const names = await page.evaluate(async () => {
    const root = await navigator.storage.getDirectory()
    const logs = await (await root.getDirectoryHandle('.folio')).getDirectoryHandle('logs')
    const names: string[] = []
    for await (const [name, handle] of logs.entries()) {
      if (handle.kind === 'file') names.push(name)
    }
    return names
  })
  expect(names).toHaveLength(1)
  expect(names[0]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z-[0-9a-f]{4}\.log$/)
})
