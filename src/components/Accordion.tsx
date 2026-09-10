import type { ReactNode } from 'react'
import styles from './Accordion.module.css'

export function Accordion({
  title,
  defaultOpen = false,
  className,
  children,
}: {
  title: string
  defaultOpen?: boolean
  /** Extra class on the `<details>`, for a placement variant such as a
   *  section anchored to its container's bottom edge. */
  className?: string
  children: ReactNode
}) {
  return (
    <details
      className={className ? `${styles.accordion} ${className}` : styles.accordion}
      open={defaultOpen}
    >
      <summary className={styles.summary}>{title}</summary>
      <div className={styles.body}>{children}</div>
    </details>
  )
}
