// Opening a vault file (open-vault-assets, ADR-0021, ADR-0022): a page's
// markdown can link to a file in the vault by path — `[Q3 report](assets/q3-report.pdf)`
// — and the browser has nothing served at that path, so the link is dead. This
// module turns such a target into an openable one: the file's bytes, read
// through the storage seam, handed to the browser as a `blob:` URL, either in a
// new tab or as a download.
//
// It lives in the vault layer because it has two callers with two different
// questions: the editor hands in an href from the document, where a destination
// is a URL and may be percent-encoded, and the app hands in a path from the
// folder listing, which is already the file's literal name and must not be
// decoded. `openVaultTarget` answers the first, `openVaultPath` the second;
// neither the classification nor the IO is editor-specific (ADR-0010).
//
// The decision half — which targets qualify, what type they are, which of the
// two branches they take — is pure and tested directly; the DOM calls sit
// behind `Openers`, so the decisions are exercised without a browser. What
// opens is a copy: the browser cannot hand a file on disk to the operating
// system in place, so the vault file is never written and never watched for a
// change made outside. Markdown stays canonical (ADR-0001).

/** Vault-relative only: a path carrying a scheme (`http:`, `https:`, `data:`,
 *  `blob:`) or starting at `/` is not a vault path. Shared with the image
 *  resolver (`fit-vault-images-to-pane`) and with the index's asset-reference
 *  extraction, so "what counts as a vault path" has exactly one definition. */
export function isVaultRelative(src: string): boolean {
  return src !== '' && !src.startsWith('/') && !/^[a-z][a-z0-9+.-]*:/i.test(src)
}

/** Extensions the browser displays when a window is pointed at their bytes,
 *  and the type to point it with. Everything else takes the download branch,
 *  where the application the operating system registered for that type opens
 *  it (design D3).
 *
 *  Deliberately its own list rather than `dropAssets`'s image set: that one
 *  decides which markdown form a drop writes, this one which files preview. */
const DISPLAYABLE: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  avif: 'image/avif',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogv: 'video/ogg',
  txt: 'text/plain',
  text: 'text/plain',
  log: 'text/plain',
  json: 'application/json',
}

/** What a path the browser has no preview for is served as. */
const UNKNOWN_TYPE = 'application/octet-stream'

/** How long an opened file's URL stays alive. A window takes the bytes when it
 *  loads them, so revoking after that is harmless; revoking before it would
 *  kill a slow load. */
const REVOKE_AFTER_MS = 60_000

/** The vault path a link targets, or null when the target is not one: an
 *  external URL, a fragment, an absolute path, an empty href, or an escape the
 *  browser cannot decode. The path is decoded, so the `%20` a Markdown
 *  destination carries for a space reaches the storage seam as the space the
 *  file has (design D7); whether it is a valid path is the storage's call
 *  (ADR-0013), not this module's. */
export function vaultTarget(href: string | null | undefined): string | null {
  // A fragment is not a path — `#section` names a place in this document, and
  // nothing is served at it (spec: non-external targets do not open).
  if (!href || href.startsWith('#') || !isVaultRelative(href)) return null
  try {
    return decodeURIComponent(href)
  } catch {
    return null
  }
}

/** A path's extension, lowercased and without the dot; '' when it has none. A
 *  leading-dot name has no extension, matching how the asset flow reads one. */
function extensionOf(path: string): string {
  const base = path.slice(path.lastIndexOf('/') + 1)
  const dot = base.lastIndexOf('.')
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : ''
}

/** The type to serve a vault path as. */
export function mimeFor(path: string): string {
  const ext = extensionOf(path)
  return Object.hasOwn(DISPLAYABLE, ext) ? DISPLAYABLE[ext] : UNKNOWN_TYPE
}

/** Whether the browser shows these bytes in a window rather than downloading
 *  them: the branch the open gesture takes (spec: what opens follows the type). */
export function isDisplayable(path: string): boolean {
  return Object.hasOwn(DISPLAYABLE, extensionOf(path))
}

/** How to read a vault file's bytes: the shape the storage seam's binary read
 *  already has, so a vault hands its own reader straight through. */
export type AssetReader = (path: string) => Promise<Blob>

/** The reader for a page with no vault behind it: it cannot answer, so a vault
 *  link opens nothing. The adapter's reader before one is attached, and the
 *  fallback for a pane that has none. */
export const noVaultReader: AssetReader = () => Promise.reject(new Error('no vault open'))

/** The DOM side of opening, injected so the decisions above can be exercised
 *  without a browser (design D8). */
export type Openers = {
  /** Open a blank window *now*, before the read, and return a handle to it;
   *  null when no window could be opened. The read fills it later, or discards
   *  it by closing it. */
  openTab: () => { setUrl: (url: string) => void; close: () => void } | null
  /** Hand the bytes to the browser as a download, for a type it cannot show. */
  download: (url: string, name: string) => void
}

/** The real openers. The blank window is opened before the read because a user
 *  gesture is what allows a window at all (design D4), and its `opener` is
 *  cleared so a file that carries script of its own cannot reach the app. */
export const domOpeners: Openers = {
  openTab: () => {
    const opened = window.open('', '_blank')
    if (!opened) return null
    opened.opener = null
    return {
      setUrl: (url) => {
        opened.location.href = url
      },
      close: () => opened.close(),
    }
  },
  download: (url, name) => {
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
  },
}

/** Open a path the vault already holds: a listing row, or a reference that was
 *  matched against the listing. The path is used as the file's literal name —
 *  no percent-decoding, because it did not come from a URL — which is what lets
 *  a name carrying a `%` open the file it actually names (ADR-0021). What opens
 *  is a copy (ADR-0021): the vault file is never written, and nothing in the app
 *  changes state. Reporting is the same as `openVaultTarget`'s. */
export async function openVaultPath(
  path: string,
  read: AssetReader,
  openers: Openers = domOpeners,
): Promise<boolean> {
  const tab = isDisplayable(path) ? openers.openTab() : null
  let bytes: Blob
  try {
    bytes = await read(path)
  } catch {
    tab?.close()
    return false
  }
  // `slice` retypes the bytes without copying them: the type travels with the
  // URL, and it is what makes the browser display rather than download.
  const url = URL.createObjectURL(bytes.slice(0, bytes.size, mimeFor(path)))
  if (tab) tab.setUrl(url)
  else openers.download(url, path.slice(path.lastIndexOf('/') + 1))
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS)
  return true
}

/** Read `href`'s vault file and open it, reporting whether anything opened. A
 *  target that is not a vault path, or a file the vault cannot resolve, opens
 *  nothing and leaves the app as it is (spec: an unresolvable vault target
 *  opens nothing). A window that could not be opened falls back to the download
 *  branch, so the file still reaches the user. */
export async function openVaultTarget(
  href: string,
  read: AssetReader,
  openers: Openers = domOpeners,
): Promise<boolean> {
  const path = vaultTarget(href)
  if (path === null) return false
  return openVaultPath(path, read, openers)
}
