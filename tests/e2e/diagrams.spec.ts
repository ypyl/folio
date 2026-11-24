import { expect, test } from '@playwright/test'
import { editor, installVaultPicker, openVault, readVaultFile, seedVault } from './helpers/vault'

// openspec/specs/diagrams: a fenced `mermaid` block draws its diagram in the
// page and on a slide, the Markdown stays canonical, and the source comes back
// at the caret. The run sets `VITE_DIAGRAMS=1` (playwright.config.ts), so the
// engine is exercised while the shipped build keeps the capability off.

const PAGE = `# Flow

Before.

\`\`\`mermaid
flowchart TD
  A[Open vault] --> B[Index]
  B --> C[Draw]
\`\`\`

After.
`

test('a mermaid fence draws its diagram, and the source comes back at the caret', async ({
  page,
}) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, { 'pages/Flow.md': PAGE })
  await openVault(page)
  await page.getByRole('button', { name: 'Flow' }).click()

  // Drawn while the caret is elsewhere: the engine is fetched lazily, so this
  // waits for the drawing rather than asserting synchronously.
  const drawn = page.locator('figure.folio-diagram[data-state="drawn"]')
  await expect(drawn).toBeVisible({ timeout: 20_000 })
  await expect(drawn.locator('svg')).toBeVisible()
  await expect(editor(page)).not.toContainText('flowchart TD')

  // A press on the drawing places the caret in the fence, which shows its
  // source, as a table and an image already do.
  await drawn.click()
  await expect(editor(page)).toContainText('flowchart TD')

  // Moving the caret away draws it again.
  await editor(page).click({ position: { x: 4, y: 4 } })
  await expect(drawn).toBeVisible()

  // The page is still exactly what it was: a drawing writes nothing.
  await page.waitForTimeout(1200)
  expect(await readVaultFile(page, 'pages/Flow.md')).toBe(PAGE)
})

test('a source the engine refuses reads as its own text with a note', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Broken.md': '# Broken\n\n```mermaid\nthis is not a diagram\n```\n',
  })
  await openVault(page)
  await page.getByRole('button', { name: 'Broken' }).click()

  const failed = page.locator('figure.folio-diagram[data-state="failed"]')
  await expect(failed).toBeVisible({ timeout: 20_000 })
  await expect(failed).toContainText('this is not a diagram')
  await expect(failed.locator('.folio-diagram-note')).toBeVisible()

  // The text is still editable: the press lands the caret in the fence.
  await failed.click()
  await expect(editor(page)).toContainText('this is not a diagram')
})

// A page whose only content is the diagram, which is how a reader first meets
// the feature: the seeded caret sits at the document start, on the fence's own
// start, and the drawing must still appear with no click and no keypress.
test('a page that opens on a diagram shows it without a click', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Only.md': '```mermaid\nflowchart TD\n  A[Open] --> B[Draw]\n```\n',
  })
  await openVault(page)
  await page.getByRole('button', { name: 'Only' }).click()

  const drawn = page.locator('figure.folio-diagram[data-state="drawn"]')
  await expect(drawn).toBeVisible({ timeout: 20_000 })
  await expect(drawn.locator('svg')).toBeVisible()
  await expect(editor(page)).not.toContainText('flowchart TD')
})
