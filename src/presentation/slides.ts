// Presentation slide policy (add-presentations, design D3). A pure function
// over the editor's serialized top-level blocks: a top-level thematic break
// (`hr`) starts a new slide, and a segment with no content is dropped. It never
// parses Markdown — the caller passes blocks read from the live document — so a
// `---` inside a fenced code block or nested in another block is content, not a
// boundary, because it is not a top-level `hr`.

import type { StaticBlock } from '../editor/editor'

/** The ProseMirror node type a thematic break serializes as. */
const THEMATIC_BREAK = 'hr'

/**
 * Split serialized top-level blocks into slides. The first slide is everything
 * before the first break, the last is everything after the last; no break means
 * one slide. An empty segment (a leading, trailing, or doubled break) produces
 * no slide. A page that is only breaks has nothing to present, so it yields one
 * empty slide rather than a deck that cannot render.
 */
export function deriveSlides(blocks: readonly StaticBlock[]): string[] {
  const segments: string[] = []
  let current: string[] = []
  for (const block of blocks) {
    if (block.type === THEMATIC_BREAK) {
      segments.push(current.join(''))
      current = []
    } else {
      current.push(block.html)
    }
  }
  segments.push(current.join(''))
  const slides = segments.filter((slide) => slide !== '')
  return slides.length > 0 ? slides : ['']
}
