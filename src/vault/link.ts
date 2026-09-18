// How a vault file is named in Markdown (add-asset-references, design D6): the
// text a drop, a paste, or the destination picker writes for a vault file, and
// the inverse rule the index reads back with (`parse.ts`: `assetPath`). One
// module, because three writers and one reader have to agree on it. The
// escaping is what makes the written text a link at all — micromark ends a
// destination at the space, so `[Q3 report](assets/Q3 report.pdf)` is not a
// link — and the image rule decides both which form a file is written in and
// which files an image destination may offer.
//
// No IO, no DOM, no editor: pure string rules that the component layer, the
// editor layer, and the vault layer all need (ADR-0010).

/** Image extensions are written as `![..]`; everything else as a plain link. */
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'])

/**
 * The characters that would end or alter a Markdown destination, and what they
 * become. The percent sign is here because a literal one would be read back as
 * an escape start (`assets/100% done.pdf`), and `/` is deliberately absent: the
 * separator has to survive. `encodeURIComponent` is the wrong tool for exactly
 * these two reasons — it escapes `/` and leaves the parentheses.
 */
const DESTINATION_ESCAPES: Record<string, string> = {
  '%': '%25',
  ' ': '%20',
  '(': '%28',
  ')': '%29',
  '<': '%3C',
  '>': '%3E',
  '"': '%22',
  "'": '%27',
  '`': '%60',
}

const DESTINATION_ESCAPE = /[% ()<>"'`]/g

/** The file's own name: the path's last segment. */
function baseName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1)
}

/** A filename split at its extension: `stem` without the dot, `ext` with it
 *  (empty when there is none). A leading-dot name has no extension. */
export function splitExtension(name: string): { stem: string; ext: string } {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? { stem: name.slice(0, dot), ext: name.slice(dot) } : { stem: name, ext: '' }
}

/** Whether a vault path names a file the app writes as an image. The one rule
 *  the written form and the image-destination candidate pool share. */
export function isImagePath(path: string): boolean {
  const type = splitExtension(baseName(path)).ext.slice(1).toLowerCase()
  return type !== '' && IMAGE_EXTENSIONS.has(type)
}

/** The label a written reference uses: the file's name without its extension. */
export function linkLabel(path: string): string {
  return splitExtension(baseName(path)).stem
}

/** The destination to write for a vault path (design D6): the characters that
 *  would end or alter a destination percent-encoded, everything else literal.
 *  Decoding the result yields the path exactly, so the index, the image
 *  resolver, and the open gesture all name the same file. */
export function markdownDestination(path: string): string {
  return path.replace(DESTINATION_ESCAPE, (char) => DESTINATION_ESCAPES[char])
}

/** Markdown link for a vault file path; link text is the basename's stem. */
export function linkForAsset(path: string): string {
  const destination = markdownDestination(path)
  return isImagePath(path)
    ? `![${linkLabel(path)}](${destination})`
    : `[${linkLabel(path)}](${destination})`
}
