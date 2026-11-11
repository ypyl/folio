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

// show-recent-changes-from-the-version-badge: the status bar's version names the
// build and opens what the build carries. The list comes from the bundled
// changelog, so the panel opens on real entries with no vault, no network, and
// no git.
test('the version badge lists the build’s recent changes', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')

  const badge = page.getByRole('button', { name: /show the recent changes$/ })
  // Named by its heading, so it is found by that name rather than by text that
  // an entry may also carry.
  const panel = page.getByRole('group', { name: 'Recent changes' })
  await expect(badge).toBeVisible()
  await expect(badge).toHaveAttribute('aria-expanded', 'false')
  await expect(panel).toBeHidden()

  await badge.click()
  await expect(badge).toHaveAttribute('aria-expanded', 'true')
  await expect(panel).toBeVisible()
  // Entries carry the change and the day it landed, newest first.
  await expect(panel.getByRole('listitem').first()).toContainText(/\d{4}-\d{2}-\d{2}/)

  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(badge).toHaveAttribute('aria-expanded', 'false')
  await expect(badge).toBeFocused()
})
