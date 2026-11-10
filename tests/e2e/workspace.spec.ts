import { expect, test } from '@playwright/test'
import { installVaultPicker } from './helpers/vault'

// openspec/specs/workspace: the no-folder state before any vault is opened.
test('the no-folder state invites opening a folder', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')

  await expect(page.getByText('Open a folder to begin.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add folder' })).toBeVisible()

  // add-landing-page-info: the screen says what Folio is and does, and points
  // at the tour.
  await expect(page.getByText(/Folio is a local-first notes app/)).toBeVisible()
  // simplify-the-brand-screen: the facts are a labeled row, not a sentence.
  const facts = page.locator('[data-tour="editor"]').getByRole('listitem')
  await expect(facts).toHaveCount(3)
  await expect(facts.nth(0)).toContainText('Pages & journals')
  await expect(facts.nth(0)).toContainText('Plain Markdown files')
  await expect(facts.nth(1)).toContainText('#word or #[[Page]]')
  await expect(facts.nth(2)).toContainText('#!board')

  // No vault yet: search is disabled, and the trail and Today have nowhere to go.
  await expect(page.getByRole('button', { name: 'Open search' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Back' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Forward' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Today' })).toBeDisabled()

  // The right panel is present, with its shortcuts reference.
  await expect(page.getByText('Keyboard shortcuts')).toBeVisible()

  // The project's public repository is reachable from here.
  await expect(page.getByText(/Found a bug or have a feature request\?/)).toBeVisible()
  const repo = page.getByRole('link', { name: 'Folio on GitHub' })
  await expect(repo).toBeVisible()
  await expect(repo).toHaveAttribute('href', 'https://github.com/ypyl/folio')
})

// add-app-tour: the cut-out's real geometry needs a browser (jsdom has no
// layout). The rail's control opens the tour, the cut-out tracks the rail's own
// box, the steps move, and ending the tour returns focus to the control.
test('the rail starts a tour over the shell regions', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')

  const control = page.locator('#folder-rail').getByRole('button', { name: 'Take the tour' })
  await expect(control).toBeVisible()
  await control.click()

  const card = page.getByRole('dialog', { name: 'App tour' })
  await expect(card).toBeVisible()
  await expect(card).toContainText('Your folders')

  // The cut-out is the step's region, in the same viewport coordinates.
  const rail = await page.locator('#folder-rail').boundingBox()
  const cut = await page.locator('[data-testid="tour-hole"]').boundingBox()
  expect(rail).not.toBeNull()
  expect(cut).not.toBeNull()
  expect(Math.abs(cut!.x - rail!.x)).toBeLessThan(2)
  expect(Math.abs(cut!.y - rail!.y)).toBeLessThan(2)
  expect(Math.abs(cut!.width - rail!.width)).toBeLessThan(2)
  expect(Math.abs(cut!.height - rail!.height)).toBeLessThan(2)

  // Steps move forward and back.
  await card.getByRole('button', { name: 'Next' }).click()
  await expect(card).toContainText('Journal and Files')
  await card.getByRole('button', { name: 'Back' }).click()
  await expect(card).toContainText('Your folders')

  // Ending the tour returns focus to the control that opened it.
  await card.getByRole('button', { name: 'Skip' }).click()
  await expect(card).toBeHidden()
  await expect(control).toBeFocused()
})

// add-landing-page-info: the brand screen's own reference opens the same tour.
test('the brand screen opens the tour from its reference', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')

  const brand = page.locator('[data-tour="editor"]')
  await expect(brand.getByText(/Folio is a local-first notes app/)).toBeVisible()
  await brand.getByRole('button', { name: 'Take the tour' }).click()
  await expect(page.getByRole('dialog', { name: 'App tour' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'App tour' })).toContainText('Your folders')
})

// explain-the-experimental-switch: the rail's experimental control says what it
// turns on, on hover and on keyboard focus, and the tip is a real floating
// surface beside the rail rather than a clipped child of its scroll box.
test('the experimental control lists what it enables', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')

  const control = page.getByRole('button', { name: 'Experimental features' })
  await expect(control).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('tooltip')).toHaveCount(0)

  // Hover: the gated feature and what it does.
  await control.hover()
  const tip = page.getByRole('tooltip')
  await expect(tip).toBeVisible()
  await expect(tip).toContainText('Session trace')
  await expect(tip).toContainText('Records writes and failures')

  // Beside the rail, inside the viewport: the rail's scroll box would clip a
  // child that did not escape it.
  const rail = (await page.locator('#folder-rail').boundingBox())!
  const box = (await tip.boundingBox())!
  expect(box.x).toBeGreaterThan(rail.x + rail.width)
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width)

  // Leaving hides it, and keyboard focus brings it back.
  await page.mouse.move(rail.x + rail.width + 200, rail.y + 40)
  await expect(page.getByRole('tooltip')).toHaveCount(0)
  await control.focus()
  await expect(page.getByRole('tooltip')).toBeVisible()

  // The tip never takes the press: clicking the focused control still flips it.
  await control.click()
  await expect(control).toHaveAttribute('aria-pressed', 'true')
})
