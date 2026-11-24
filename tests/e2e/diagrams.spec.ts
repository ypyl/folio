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

// A drawing is filled in after its box is mounted, so the block grows without
// CodeMirror's knowledge. The lines below it then sit where the editor's cached
// measurements do not expect them, and a press on a reference in them does
// nothing until something else forces a measure (reported 2026-11-25: a
// reference below a diagram never opened, the same reference above it did).
test('a reference below a diagram still opens', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Flow.md':
      '# Flow\n\n```mermaid\nflowchart TD\n  A[Open vault] --> B{Index built?}\n  B -->|no| C[Scan the folder]\n  C --> B\n  B -->|yes| D[Render the page]\n  D --> E[(Markdown files)]\n  E --> C\n```\n\nBelow the drawing, #second is a reference.\n',
    'pages/second.md': 'Second page.',
  })
  await openVault(page)
  await page.getByRole('button', { name: 'Flow' }).click()

  // The drawing lands first: that is what makes the block grow.
  await expect(page.locator('figure.folio-diagram[data-state="drawn"]')).toBeVisible({
    timeout: 20_000,
  })

  const chip = page.locator('.ref', { hasText: '#second' })
  await expect(chip).toBeVisible()
  await chip.click()
  await expect(editor(page)).toContainText('Second page.')
})

// A page that opens on its own diagram seeds the caret at the fence's first
// character, which the reveal rule counts as outside it. The first press on the
// drawing must still open it for editing (reported 2026-11-25: the first press
// did nothing, a press after clicking elsewhere did).
test('the first press on a diagram a page opened on shows its source', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Only.md': '```mermaid\nflowchart TD\n  A[Open] --> B[Draw]\n```\n',
  })
  await openVault(page)
  await page.getByRole('button', { name: 'Only' }).click()

  const drawn = page.locator('figure.folio-diagram[data-state="drawn"]')
  await expect(drawn).toBeVisible({ timeout: 20_000 })
  await expect(editor(page)).not.toContainText('flowchart TD')

  // The first press, with the caret still where the page seeded it.
  await drawn.click()
  await expect(editor(page)).toContainText('flowchart TD')
})
