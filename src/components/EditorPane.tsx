import { useEffect, useRef } from 'react'
import { FolioMark } from '../FolioMark'
import { MarkdownPreview } from './MarkdownPreview'
import type { Page } from '../page'
import styles from './EditorPane.module.css'

// Receives the page via props (design decision 3); never imports the vault.
// The empty state has two variants: no usable folder -> invite to open one
// (no-folder spec requirement), else the brand empty state.
export function EditorPane({
  page,
  emptyHint = 'notes',
}: {
  page: Page | null
  emptyHint?: 'notes' | 'open-folder'
}) {
  const paneRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (paneRef.current) paneRef.current.scrollTop = 0
  }, [page])

  if (page === null) {
    return (
      <main ref={paneRef} className={styles.pane}>
        <div className={styles.emptyState}>
          <FolioMark className={styles.mark} />
          <p className={styles.tagline}>
            {emptyHint === 'open-folder'
              ? 'Open a folder to begin.'
              : 'Your notes appear here.'}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main ref={paneRef} className={styles.pane}>
      <article className={styles.document}>
        <h1 className={styles.title}>{page.title}</h1>
        <MarkdownPreview content={page.content} />
      </article>
    </main>
  )
}