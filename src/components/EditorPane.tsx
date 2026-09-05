import { useEffect, useRef } from 'react'
import { FolioMark } from '../FolioMark'
import { MarkdownPreview } from './MarkdownPreview'
import type { Page } from '../page'
import styles from './EditorPane.module.css'

// Receives the page via props (design decision 3); never imports the mock.
export function EditorPane({ page }: { page: Page | null }) {
  const paneRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (paneRef.current) paneRef.current.scrollTop = 0
  }, [page])

  if (page === null) {
    return (
      <main ref={paneRef} className={styles.pane}>
        <div className={styles.emptyState}>
          <FolioMark className={styles.mark} />
          <p className={styles.tagline}>Your notes appear here.</p>
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