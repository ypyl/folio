import { expect, test, type Page } from '@playwright/test'
import {
  editor,
  installVaultPicker,
  metaPanel,
  metaSection,
  openVault,
  readVaultFile,
  seedVault,
  todayJournalPath,
} from './helpers/vault'

// openspec/specs/contents: the right panel's Contents section, over a real
// page. jsdom has no layout, so the parts that need one (the indent the tree
// draws, a long outline scrolling inside its own band, a heading scrolled into
// view by its row) are checked here.

const PAGE = `# Alpha

Intro paragraph.

## Beta **bold**

- list item one
  - nested list item
- list item two

### Gamma \`code\`

## Delta

# Epsilon

## Zeta
`

/** The Contents section of the right panel. */
const contentsSection = (page: Page) => metaSection(page, 'Contents')

/** The heading rows (label buttons), without the disclosure controls or the
 *  whole-outline controls on the section's own row. */
const rows = (page: Page) =>
  contentsSection(page).locator(':scope > div button:not([aria-expanded])')

test('lists the headings in document order, indented by level, as plain text', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, { 'pages/Shape.md': PAGE, [todayJournalPath()]: 'Today.' })
  await openVault(page)
  await page.getByRole('button', { name: 'Shape', exact: true }).click()
  await expect(editor(page)).toContainText('Intro paragraph.')

  const contents = contentsSection(page)
  // Every heading has a row, in document order, labelled with its plain text:
  // the bold markers and the code span are reduced away.
  await expect(rows(page)).toHaveText([
    'Alpha',
    'Beta bold',
    'Gamma code',
    'Delta',
    'Epsilon',
    'Zeta',
  ])

  // A list item never produces a row.
  await expect(contents.getByText('list item one')).toHaveCount(0)

  // The tree indents by level: Beta sits under Alpha, Gamma under Beta, Delta,
  // back at level two, is indented like Beta, and the second root Epsilon
  // returns to Alpha's own indent.
  const indents = await contents
    .locator('[style*="padding-left"]')
    .evaluateAll((els) => els.map((el) => Number.parseFloat((el as HTMLElement).style.paddingLeft)))
  expect(indents).toHaveLength(6)
  expect(indents[1]).toBeGreaterThan(indents[0]!)
  expect(indents[2]).toBeGreaterThan(indents[1]!)
  expect(indents[3]).toBe(indents[1]!)
  expect(indents[4]).toBe(indents[0]!)
  expect(indents[5]).toBeGreaterThan(indents[4]!)
})

test('a subtree collapses from its own control and the label still locates', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, { 'pages/Shape.md': PAGE, [todayJournalPath()]: 'Today.' })
  await openVault(page)
  await page.getByRole('button', { name: 'Shape', exact: true }).click()
  await expect(editor(page)).toContainText('Intro paragraph.')

  const contents = contentsSection(page)

  // Only a heading with a subtree carries a disclosure control.
  await expect(contents.getByRole('button', { name: 'Collapse Alpha' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
  await expect(contents.getByRole('button', { name: 'Collapse Delta' })).toHaveCount(0)

  // Collapsing hides the subtree and reports the state; the heading itself and
  // its sibling stay. The page's text is untouched.
  await contents.getByRole('button', { name: 'Collapse Alpha' }).click()
  await expect(contents.getByRole('button', { name: 'Expand Alpha' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  // Delta is Alpha's own level-two child, so it goes with the subtree; the
  // second root keeps its own.
  await expect(rows(page)).toHaveText(['Alpha', 'Epsilon', 'Zeta'])
  expect(await readVaultFile(page, 'pages/Shape.md')).toBe(PAGE)

  // Expanding brings the subtree back, and a press on a label locates its
  // heading instead of toggling anything.
  await contents.getByRole('button', { name: 'Expand Alpha' }).click()
  await expect(rows(page)).toHaveText([
    'Alpha',
    'Beta bold',
    'Gamma code',
    'Delta',
    'Epsilon',
    'Zeta',
  ])
  await expect(contents.getByRole('button', { name: 'Collapse Alpha' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
})

test('Expand all and Collapse all set every subtree and change only what is shown', async ({
  page,
}) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, { 'pages/Shape.md': PAGE, [todayJournalPath()]: 'Today.' })
  await openVault(page)
  await page.getByRole('button', { name: 'Shape', exact: true }).click()
  await expect(editor(page)).toContainText('Intro paragraph.')

  const contents = contentsSection(page)

  // The controls sit on the section's own row, with the rows.
  await contents.getByRole('button', { name: 'Collapse all' }).click()
  // Every subtree is collapsed at once: only the top-level headings remain.
  await expect(rows(page)).toHaveText(['Alpha', 'Epsilon'])
  await expect(contents.getByRole('button', { name: 'Expand Alpha' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  // The section stayed open: a control is not the section's toggle.
  await expect(contents).toHaveAttribute('open', '')

  await contents.getByRole('button', { name: 'Expand all' }).click()
  await expect(rows(page)).toHaveText([
    'Alpha',
    'Beta bold',
    'Gamma code',
    'Delta',
    'Epsilon',
    'Zeta',
  ])

  // A single subtree still toggles after the whole-outline extremes.
  await contents.getByRole('button', { name: 'Collapse Alpha' }).click()
  await expect(rows(page)).toHaveText(['Alpha', 'Epsilon', 'Zeta'])

  // Collapsing is a view operation: the page's Markdown is exactly as it was.
  expect(await readVaultFile(page, 'pages/Shape.md')).toBe(PAGE)
})

test('activating a row scrolls its heading into view and frames it', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  const body = Array.from({ length: 40 }, (_, i) => `Paragraph ${i}.`).join('\n\n')
  await seedVault(page, {
    'pages/Long.md': `# Start\n\n${body}\n\n## Far away\n\nThe end.\n`,
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await page.getByRole('button', { name: 'Long', exact: true }).click()
  await expect(editor(page)).toContainText('Paragraph 0.')

  const heading = editor(page).getByText('Far away', { exact: true })
  await expect(heading).not.toBeInViewport()

  await contentsSection(page).getByRole('button', { name: 'Far away' }).click()

  // The heading is scrolled into view and carries the editor's locate frame.
  await expect(heading).toBeInViewport()
  await expect(page.locator('.folio-search-hit')).toHaveCount(1)
  await expect(page.locator('.folio-search-hit')).toContainText('Far away')

  // Locating changed nothing on disk and kept the page open.
  await expect(editor(page)).toContainText('The end.')
  expect(await readVaultFile(page, 'pages/Long.md')).toContain('## Far away')
})

test('a long outline scrolls inside the Contents band, not the panel', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  const headings = Array.from({ length: 40 }, (_, i) => `## Heading ${i}`).join('\n\n')
  await seedVault(page, {
    'pages/Many.md': `# Top\n\n${headings}\n`,
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)
  await page.getByRole('button', { name: 'Many', exact: true }).click()
  await expect(editor(page)).toContainText('Heading 0')

  const contents = contentsSection(page)
  // With Links open, Contents is capped and scrolls in its own body; with Links
  // collapsed it would grow instead, which is the widget's other state.
  await metaSection(page, 'Links').locator('summary').click()

  const band = contents.locator(':scope > div')
  const geometry = await band.evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
  }))
  expect(geometry.scrollHeight).toBeGreaterThan(geometry.clientHeight)

  await band.evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })
  await expect
    .poll(() => band.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0)
  // The panel itself did not scroll.
  expect(await metaPanel(page).evaluate((el) => el.scrollTop)).toBe(0)
})

test('shows a state for every surface and no Contents section for a board', async ({ page }) => {
  await installVaultPicker(page)
  await page.goto('/')
  await seedVault(page, {
    'pages/Plain.md': 'No heading here, only prose.',
    'pages/Referrer.md': 'A board: #![[Plan]]',
    'boards/Plan.excalidraw': '{}',
    [todayJournalPath()]: 'Today.',
  })
  await openVault(page)

  // A page with no heading shows empty copy and no rows.
  await page.getByRole('button', { name: 'Plain', exact: true }).click()
  await expect(editor(page)).toContainText('No heading here')
  await expect(contentsSection(page).getByText('No headings on this page.')).toBeVisible()
  await expect(rows(page)).toHaveCount(0)
  // No rows means no whole-outline controls.
  await expect(contentsSection(page).getByRole('button', { name: 'Expand all' })).toHaveCount(0)

  // A board has no page shape: the panel shows its Referenced by section
  // instead, and no Contents.
  await page.getByRole('button', { name: 'Plan.excalidraw', exact: true }).click()
  await expect(page.locator('.excalidraw canvas.interactive')).toBeVisible({ timeout: 20_000 })
  await expect(metaPanel(page).getByText('Contents')).toHaveCount(0)
  const referencedBy = metaSection(page, 'Referenced by')
  await expect(referencedBy.getByRole('button', { name: 'Referrer' })).toBeVisible()
})
