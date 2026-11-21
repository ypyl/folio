import { expect, test } from '@playwright/test'
import { installVaultPicker } from './helpers/vault'

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
