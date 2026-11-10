// The one rule for a name the vault folder can hold. The File System Access
// API validates every path segment with the portable-name rule before it
// touches the disk, on every platform: a name holding a refused character can
// be neither written nor read, and the browser reports it only as an opaque
// `TypeError: Name is not allowed` at the call site. Both sides of the vault
// ask this question, for different reasons: the reference layer, before it
// turns a token into a page a save would materialize (a name the folder cannot
// hold is not a page name, so the token stays text), and the storage transport,
// before it walks a path (ADR-0013: invalid paths are rejected, not sanitized).
//
// Pure, no IO: the parser and the transport both import it, and neither gains a
// dependency on the other.

/** Refused in a path component: the Windows-forbidden set, the two separators,
 *  and the C0/DEL control characters. A separator belongs here even though it
 *  splits a path: inside a name it would silently become one, and the page it
 *  produced would carry the last segment as its title, not the name. */
const UNSAFE_CHARACTER = /[<>:"/\\|?*]|\p{Cc}/u

/** Windows refuses these stems as devices, with or without an extension. The
 *  app is Chromium-first on Windows, where the browser refuses them too. */
const DEVICE_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i

/** Whether `name` can be a file name in the folder. */
export function isWritableFileName(name: string): boolean {
  return name !== '' && !UNSAFE_CHARACTER.test(name) && !DEVICE_NAME.test(name)
}
