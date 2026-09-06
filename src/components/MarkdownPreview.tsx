// Throwaway micro-renderer for the static-navigation mock (design decision 4).
// Shows Markdown loosely until Milkdown becomes the editor (plan task 7).
// Renders: ATX headings, paragraphs, and page references (#word, #[[Page]])
// as inert chips. Everything else, including plain [[Page]] wikilinks, falls
// through as text. References tokenize via the shared regex from the vault
// parser, so rendering and indexing agree (design D6).

import type { ReactNode } from 'react'
import { REF } from '../vault/parse'
import styles from './MarkdownPreview.module.css'

function inline(text: string, key: number): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  let i = 0
  for (const m of text.matchAll(REF)) {
    if (m.index! > last) nodes.push(text.slice(last, m.index))
    const label = m[1] ?? m[2]
    nodes.push(
      <span key={`${key}-${i++}`} className={styles.chip}>
        {label}
      </span>,
    )
    last = m.index! + m[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function renderBlocks(content: string): ReactNode[] {
  const HEADINGS: Record<number, 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'> = {
    1: 'h1',
    2: 'h2',
    3: 'h3',
    4: 'h4',
    5: 'h5',
    6: 'h6',
  }
  const blocks: ReactNode[] = []
  let para: string[] = []
  let i = 0

  const flushPara = () => {
    if (para.length === 0) return
    blocks.push(
      <p key={`p-${i++}`} className={styles.para}>
        {inline(para.join(' '), i)}
      </p>,
    )
    para = []
  }

  for (const line of content.split('\n')) {
    if (line.trim() === '') {
      flushPara()
    } else {
      const atx = line.match(/^(#{1,6})\s+(.*)$/)
      if (atx) {
        flushPara()
        const level = atx[1].length
        const Tag = HEADINGS[level]
        blocks.push(
          <Tag key={`h-${i++}`} className={styles.heading}>
            {inline(atx[2], i)}
          </Tag>,
        )
      } else {
        para.push(line)
      }
    }
  }
  flushPara()
  return blocks
}

export function MarkdownPreview({ content }: { content: string }) {
  return <div className={styles.root}>{renderBlocks(content)}</div>
}