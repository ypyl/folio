import type { ReactNode, Ref } from 'react'
import styles from './Accordion.module.css'

/** A collapsible sidebar or right-panel section. The `ref` is the `<details>`
 *  itself, so a caller can open the section before something inside it takes
 *  focus (the status bar's day locate). */
export function Accordion({
  title,
  defaultOpen = false,
  className,
  bodyClassName,
  actions,
  children,
  ref,
}: {
  title: string
  defaultOpen?: boolean
  /** Extra class on the `<details>`, for a placement or sizing variant such as
   *  a section anchored to its container's bottom edge or one that shares the
   *  pane's leftover height (the sidebar's bands). */
  className?: string
  /** Extra class on the body, for a section whose body is the pane's own scroll
   *  region (the sidebar's Pages and Assets listings, add-asset-navigation). */
  bodyClassName?: string
  /** Controls that belong to the section itself, drawn at the summary's
   *  trailing edge before its disclosure marker (the Journal section's session
   *  navigation, put-nav-controls-on-the-journal-header). A click on them is
   *  the control's, never the section's: the click's default action, which is
   *  the details' native toggle, is cancelled here rather than in the control. */
  actions?: ReactNode
  children: ReactNode
  /** The `<details>` element, for a caller that opens the section itself. */
  ref?: Ref<HTMLDetailsElement>
}) {
  return (
    <details
      ref={ref}
      className={className ? `${styles.accordion} ${className}` : styles.accordion}
      open={defaultOpen}
    >
      <summary className={styles.summary}>
        <span className={styles.title}>{title}</span>
        {actions ? (
          <span className={styles.actions} onClick={(event) => event.preventDefault()}>
            {actions}
          </span>
        ) : null}
      </summary>
      <div className={bodyClassName ? `${styles.body} ${bodyClassName}` : styles.body}>
        {children}
      </div>
    </details>
  )
}
