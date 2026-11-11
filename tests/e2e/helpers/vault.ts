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
 */
export async function installVaultPicker(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      writable: true,
      value: async () => navigator.storage.getDirectory(),
    })
  })
}

/** Replace the private file system's contents with `files` (path -> text). */
export async function seedVault(page: Page, files: VaultFiles): Promise<void> {
  await page.evaluate(async (entries) => {
    const root = await navigator.storage.getDirectory()
    const names: string[] = []
    for await (const [name] of root.entries()) names.push(name)
    for (const name of names) await root.removeEntry(name, { recursive: true })

    for (const [path, content] of Object.entries(entries)) {
      const parts = path.split('/')
      let dir = root
      for (const part of parts.slice(0, -1)) {
        dir = await dir.getDirectoryHandle(part, { create: true })
      }
      const file = await dir.getFileHandle(parts[parts.length - 1]!, { create: true })
      const writable = await file.createWritable()
      await writable.write(content)
      await writable.close()
    }
  }, files)
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

/** The text of a file in the vault, or `''` while it does not exist yet: an
 *  open day's note is written by the debounced save, so a poll reads it before
 *  the first write and must not fail on that. */
export async function readVaultFile(page: Page, path: string): Promise<string> {
  return page.evaluate(async (path) => {
    try {
      const slash = path.indexOf('/')
      const root = await navigator.storage.getDirectory()
      const dir = slash === -1 ? root : await root.getDirectoryHandle(path.slice(0, slash))
      const file = await (await dir.getFileHandle(path.slice(slash + 1))).getFile()
      return file.text()
    } catch {
      return ''
    }
  }, path)
}
