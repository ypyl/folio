import { expect, test } from '@playwright/test'
import { installVaultPicker, openVault, seedVault } from './helpers/vault'

// The dev build registers a service worker (vite-plugin-pwa, devOptions.enabled),
// and a cached bundle would answer a page load with code the run did not build.
test.use({ serviceWorkers: 'block' })

// openspec/specs/prerelease + agent-activity: the experimental switch is the
// app-level gate for the agent capability, the shipped build carries it off, and
// the record's surface exists only while the gate is on. Every check runs
// through the real UI, so the switch is exercised the way a user finds it.
test('the experimental switch explains itself, flips, and persists', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')

  const rail = page.locator('#folder-rail')
  const control = rail.getByRole('button', { name: 'Experimental features' })
  // The shipped default: off.
  await expect(control).toHaveAttribute('aria-pressed', 'false')

  // The popup says what turning it on does (explain-the-experimental-switch).
  await control.hover()
  const tip = page.getByRole('tooltip')
  await expect(tip).toBeVisible()
  await expect(tip).toContainText('Agent tools')
  await expect(tip).toContainText('records what it did')

  // The switch sits above the rail's bottom group, which keeps one control.
  const controls = rail.locator('button, a')
  await expect(controls.last()).toHaveAccessibleName('Send feedback on GitHub')

  await control.click()
  await expect(control).toHaveAttribute('aria-pressed', 'true')

  // The preference is browser-local: a reload keeps it, and no vault file is
  // written because no folder is open at all.
  await page.reload()
  await expect(rail.getByRole('button', { name: 'Experimental features' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

test('the agent record renders only while the gate is on', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')

  const bar = page.locator('footer')
  // Gate off: no control, in the shipped build.
  await expect(bar.getByRole('button', { name: /^agent: / })).toHaveCount(0)

  await page.locator('#folder-rail').getByRole('button', { name: 'Experimental features' }).click()

  const record = bar.getByRole('button', { name: /^agent: / })
  await expect(record).toBeVisible()
  await expect(record).toContainText('agent: 0')

  // The record is a disclosure: it opens above the bar and lists what happened,
  // and Escape closes it without taking the user's place.
  await record.click()
  const panel = page.getByRole('group', { name: 'Agent activity' })
  await expect(panel).toBeVisible()
  await expect(panel).toContainText('No agent actions this session.')
  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)

  // Turning the gate off takes the control away again.
  await page.locator('#folder-rail').getByRole('button', { name: 'Experimental features' }).click()
  await expect(bar.getByRole('button', { name: /^agent: / })).toHaveCount(0)
})

// A tool call from the page, with a fake model-context interface standing in for
// the agent (the app's own registration is exercised against a real one below).
// The point is the app's path, not the protocol: the edit lands in the document
// the user is looking at, and the record says what happened.
test('a tool call changes the page and the record names it', async ({ page }) => {
  await installVaultPicker(page)
  await page.addInitScript(() => {
    const tools: { name: string; execute: (input: unknown) => unknown }[] = []
    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        registerTool: (tool: { name: string; execute: (input: unknown) => unknown }) => {
          tools.push(tool)
        },
      },
    })
    Object.defineProperty(window, '__agent', {
      configurable: true,
      value: {
        names: () => tools.map((tool) => tool.name),
        call: (name: string, input: unknown) =>
          tools.find((tool) => tool.name === name)!.execute(input),
      },
    })
  })
  await page.goto('/')
  // A folder, because a write needs a vault: the tool answers no-vault without
  // one, and this test is about what it does with one.
  await seedVault(page, { 'pages/Inbox.md': 'A place to drop thoughts.' })
  await openVault(page)
  await page.locator('.cm-content').waitFor()

  // Gate off: the page registered nothing.
  expect(
    await page.evaluate(() =>
      (window as unknown as { __agent: { names: () => string[] } }).__agent.names(),
    ),
  ).toEqual([])

  await page.locator('#folder-rail').getByRole('button', { name: 'Experimental features' }).click()
  await expect
    .poll(async () =>
      page.evaluate(
        () => (window as unknown as { __agent: { names: () => string[] } }).__agent.names().length,
      ),
    )
    .toBe(9)

  // Create a page that is not open, through the app's write path, then open it.
  const created = await page.evaluate(() =>
    (
      window as unknown as { __agent: { call: (n: string, i: unknown) => Promise<unknown> } }
    ).__agent.call('create_note', { name: 'Field notes', text: 'Observed on the walk.' }),
  )
  console.log('CREATED', JSON.stringify(created))
  expect(created).toMatchObject({ ok: true, path: 'pages/Field notes.md' })

  const files = page.locator('details', { has: page.locator('summary', { hasText: 'Files' }) })
  await files.getByRole('button', { name: 'Field notes', exact: true }).click()
  await expect(page.locator('.cm-content')).toContainText('Observed on the walk.')

  // The record names the action and the page it touched.
  await page
    .locator('footer')
    .getByRole('button', { name: /^agent: 1/ })
    .click()
  const panel = page.getByRole('group', { name: 'Agent activity' })
  await expect(panel).toContainText('create_note')
  await expect(panel).toContainText('pages/Field notes.md')
})
