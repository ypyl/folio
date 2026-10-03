// The code token mapping, in one place (DESIGN.md — Code): keyword `--brand`,
// comment `--stone`, string `--olive`, number `--dark-warm`, function/class
// `--near-black`. Two surfaces colour code — the code-block component's embedded
// editor (`codeBlockSetup`) and the page surface, where a fence is highlighted by
// the document's own grammar (ADR-0008 supersession) — and they have to agree, so
// the rules live here rather than in either of them.
//
// Hex values mirror the tokens in DESIGN.md, which cannot be imported into a
// CodeMirror style; the two must not drift.

import { type TagStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'

export const codeHighlightStyles: TagStyle[] = [
  { tag: [tags.keyword, tags.operator, tags.bool, tags.null], color: '#1B365D' }, // --brand
  { tag: [tags.comment, tags.meta], color: '#6b6a64' }, // --stone
  { tag: [tags.string, tags.regexp, tags.special(tags.string)], color: '#504e49' }, // --olive
  { tag: [tags.number, tags.integer, tags.float], color: '#3d3d3a' }, // --dark-warm
  {
    tag: [
      tags.function(tags.variableName),
      tags.className,
      tags.typeName,
      tags.definition(tags.variableName),
    ],
    color: '#141413', // --near-black
  },
]
