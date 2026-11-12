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

// add-a-feedback-control, tour-lives-in-the-demo: outside the demo the rail's
// bottom slot holds the link out to the project's issue tracker, and no tour
// control.
test('the rail sends feedback to the issue tracker', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')

  const rail = page.locator('#folder-rail')
  const feedback = rail.getByRole('link', { name: 'Send feedback on GitHub' })
  await expect(feedback).toBeVisible()
  await expect(feedback).toHaveAttribute('href', 'https://github.com/ypyl/folio/issues/new/choose')
  await expect(feedback).toHaveAttribute('target', '_blank')
  // The tour is the demo's, so the normal view carries no tour control.
  await expect(rail.getByRole('button', { name: 'Take the tour' })).toHaveCount(0)

  // The link is the rail's last control, just above the status bar's top edge.
  const feedbackBox = await feedback.boundingBox()
  const statusBox = await page.locator('.app-shell > footer').boundingBox()
  expect(feedbackBox).not.toBeNull()
  expect(statusBox).not.toBeNull()
  expect(feedbackBox!.y + feedbackBox!.height).toBeLessThanOrEqual(statusBox!.y + 1)
})

// add-app-tour, tour-lives-in-the-demo: the tour is the guided demo's, and the
// cut-out's real geometry needs a browser (jsdom has no layout). Opening the
// demo puts the tour control in the rail's bottom slot; its cut-out tracks the
// rail's own box, the steps move, and ending the tour returns focus to the
// control.
test('the demo starts a tour over the shell regions', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Open the guided demo' }).click()
  await expect(page.locator('.cm-content')).toContainText('Welcome to the Folio demo')

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

// tour-lives-in-the-demo: the brand screen names where the tour is taken and
// offers no control that opens it.
test('the brand screen names the demo as where the tour is taken', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')

  const brand = page.locator('[data-tour="editor"]')
  await expect(brand.getByText(/Folio is a local-first notes app/)).toBeVisible()
  await expect(
    brand.getByText(/the tour starts from the \? at the bottom of the left rail/),
  ).toBeVisible()
  await expect(brand.getByRole('button', { name: 'Take the tour' })).toHaveCount(0)
  await expect(page.getByRole('dialog', { name: 'App tour' })).toHaveCount(0)
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
  // Entries are grouped by the version that shipped them, newest first, and
  // each group carries the day its changes landed.
  const firstGroup = panel.getByRole('listitem').first()
  await expect(firstGroup).toContainText(/v\d+\.\d+\.\d+/)
  await expect(firstGroup).toContainText(/\d{4}-\d{2}-\d{2}/)

  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(badge).toHaveAttribute('aria-expanded', 'false')
  await expect(badge).toBeFocused()
})
