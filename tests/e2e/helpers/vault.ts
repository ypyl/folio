import type { Page } from '@playwright/test'

export type VaultFiles = Record<string, string>

/**
 * Today's journal path, in the zone the browser is pinned to (UTC), so a test's
 * date and the app's agree.
 */
export function todayJournalPath(): string {
  return `journals/${new Date().toISOString().slice(0, 10)}.md`
}

/**
 * Make the app's folder picker return the origin's private file system. The
 * real FileSystemVaultStorage then runs against a real directory handle in the
 * browser; only the OS dialog is replaced. Installed before the first
 * navigation, so it also survives reloads.
 *
 * `folder` picks a named subfolder of the private file system instead of its
 * root. The root handle has no name, so a test that reads the folder's name back
 * (the rail's labels, the status bar, the session trace) opens a named folder.
 * `seedVault`, `readVaultFile`, and `listVaultFiles` take the same name.
 */
export async function installVaultPicker(page: Page, folder = ''): Promise<void> {
  await page.addInitScript((picked) => {
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      writable: true,
      value: async () => {
        const root = await navigator.storage.getDirectory()
        return picked === '' ? root : root.getDirectoryHandle(picked, { create: true })
      },
    })
  }, folder)
}

/** Replace the vault's contents with `files` (path -> text). */
export async function seedVault(page: Page, files: VaultFiles, folder = ''): Promise<void> {
  await page.evaluate(
    async ({ entries, name }) => {
      const root = await navigator.storage.getDirectory()
      const base =
        name === '' ? root : await root.getDirectoryHandle(name, { create: true })
      const names: string[] = []
      for await (const [entry] of base.entries()) names.push(entry)
      for (const entry of names) await base.removeEntry(entry, { recursive: true })

      for (const [path, content] of Object.entries(entries)) {
        const parts = path.split('/')
        let dir = base
        for (const part of parts.slice(0, -1)) {
          dir = await dir.getDirectoryHandle(part, { create: true })
        }
        const file = await dir.getFileHandle(parts[parts.length - 1]!, { create: true })
        const writable = await file.createWritable()
        await writable.write(content)
        await writable.close()
      }
    },
    { entries: files, name: folder },
  )
}

/** Write one file into the vault without touching the rest, the way an outside
 *  edit reaches the folder. Removes it when `content` is null. */
export async function writeVaultFile(
  page: Page,
  path: string,
  content: string | null,
  folder = '',
): Promise<void> {
  await page.evaluate(
    async ({ path, content, name }) => {
      const root = await navigator.storage.getDirectory()
      const base = name === '' ? root : await root.getDirectoryHandle(name)
      const parts = path.split('/')
      const fileName = parts[parts.length - 1]!
      let dir = base
      for (const part of parts.slice(0, -1)) {
        dir = await dir.getDirectoryHandle(part, content === null ? undefined : { create: true })
      }
      if (content === null) {
        await dir.removeEntry(fileName).catch(() => {})
        return
      }
      const file = await dir.getFileHandle(fileName, { create: true })
      const writable = await file.createWritable()
      await writable.write(content)
      await writable.close()
    },
    { path, content, name: folder },
  )
}

/** Every file path the vault holds, sorted: what a test compares when it needs
 *  to know that an action wrote nothing. */
export async function listVaultFiles(page: Page, folder = ''): Promise<string[]> {
  return page.evaluate(async (name) => {
    const root = await navigator.storage.getDirectory()
    const base = name === '' ? root : await root.getDirectoryHandle(name)
    const paths: string[] = []
    const walk = async (dir: FileSystemDirectoryHandle, prefix: string): Promise<void> => {
      for await (const [entry, handle] of dir.entries()) {
        if (handle.kind === 'directory') await walk(handle, `${prefix}${entry}/`)
        else paths.push(`${prefix}${entry}`)
      }
    }
    await walk(base, '')
    return paths.sort()
  }, folder)
}

/** Open the seeded vault. On a wide window that is the folder rail's add
 *  control; on a phone, where the compact shell's landing is the brand screen
 *  and the rail is a view away, it is the same action offered by the brand
 *  screen (make-the-app-usable-on-a-phone). */
export async function openVault(page: Page): Promise<void> {
  const add = page.getByRole('button', { name: 'Add folder', exact: true })
  if (await add.isVisible()) {
    await add.click()
    return
  }
  await page.getByRole('button', { name: 'Open folder', exact: true }).click()
}

/** The editor's editable Markdown surface. */
export function editor(page: Page) {
  return page.locator('.cm-content')
}

/** The sidebar's Files listing. Both strips render it, so a test that needs one
 *  scopes to the sidebar pane. */
export function filesSection(page: Page) {
  return page
    .locator('#sidebar-pane details')
    .filter({ has: page.locator('summary', { hasText: 'Files' }) })
}

/** The right panel. */
export function metaPanel(page: Page) {
  return page.getByRole('complementary', { name: 'Page sidebar' })
}

/** A named section of the right panel, as its `<details>` element. */
export function metaSection(page: Page, title: string) {
  return metaPanel(page)
    .locator('details')
    .filter({ has: page.locator('summary', { hasText: title }) })
}

/** The text of a file in the vault, or `''` while it does not exist yet: an
 *  open day's note is written by the debounced save, so a poll reads it before
 *  the first write and must not fail on that. */
export async function readVaultFile(page: Page, path: string, folder = ''): Promise<string> {
  return page.evaluate(
    async ({ path, name }) => {
      try {
        const parts = path.split('/')
        const root = await navigator.storage.getDirectory()
        let dir = name === '' ? root : await root.getDirectoryHandle(name)
        for (const part of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(part)
        const file = await (await dir.getFileHandle(parts[parts.length - 1]!)).getFile()
        return file.text()
      } catch {
        return ''
      }
    },
    { path, name: folder },
  )
}
