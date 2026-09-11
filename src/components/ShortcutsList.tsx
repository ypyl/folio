import { memo, useId } from 'react'
import { SHORTCUT_GROUPS, displayKeys } from './shortcuts'
import styles from './ShortcutsList.module.css'

// The keyboard-shortcuts reference body (move-help-to-right-panel). Rows are a
// label plus its key chips. Since apply-shortcuts-on-click each key combination
// the app binds is a control that applies it (design D1/D7): one button per
// combination, because a row may list two. A row whose combination is not bound
// on keydown keeps a plain chip — it documents a gesture a click cannot perform
// (design D4). No heading elements: the app's chrome has none (accordion titles
// are <summary>), so a <p> labelled section carries the same grouping for
// assistive technology without planting an orphaned heading level.
//
// Memoized because the list is static content: it depends only on the app's
// availability per surface, so it must not re-render on an ordinary edit. That
// holds only while the caller passes stable props — App memoizes canApply and
// keeps onApply in a useCallback — which App.test.tsx pins by counting
// displayKeys calls across an edit.
export const ShortcutsList = memo(function ShortcutsList({
  onApply,
  canApply,
}: {
  /** Apply a key combination. `target` names the surface it acts on: the editor
   *  or the document (the app's own key listeners). */
  onApply: (chord: string, target: 'editor' | 'app') => void
  /** Which surfaces can accept a combination right now. A row whose surface is
   *  unavailable renders disabled rather than acting on nothing (design D5). */
  canApply: Record<'editor' | 'app', boolean>
}) {
  // One id namespace per instance: group labels address their own section, and
  // each control is named by its row's label plus its own key tokens.
  const baseId = useId()

  return (
    <>
      {SHORTCUT_GROUPS.map((group, groupIndex) => {
        const headingId = `${baseId}-group-${groupIndex}`
        return (
          <section key={group.heading} className={styles.group} aria-labelledby={headingId}>
            <p id={headingId} className={styles.groupHeading}>
              {group.heading}
            </p>
            <ul className={styles.list}>
              {group.items.map((item) => {
                const interactive = item.replayable !== false
                return (
                  <li key={item.label} className={styles.row}>
                    <span className={styles.label}>{item.label}</span>
                    <span className={styles.keys}>
                      {item.keys.map((key) => {
                        if (!interactive) {
                          return (
                            <kbd key={key} className={styles.kbd}>
                              {displayKeys(key)}
                            </kbd>
                          )
                        }
                        return (
                          <button
                            key={key}
                            type="button"
                            className={styles.kbd}
                            // The control's name is its row's label plus its own
                            // tokens, so a two-chord row announces two distinct
                            // controls ("Redo Ctrl+Y" / "Redo Shift+Ctrl+Z").
                            // aria-label rather than aria-labelledby: a
                            // labelledby that points at the row's label makes
                            // the row's text read as a label for the control,
                            // which collides with the search box's own label.
                            aria-label={`${item.label} ${displayKeys(key)}`}
                            disabled={!canApply[group.target]}
                            onClick={() => onApply(key, group.target)}
                          >
                            <kbd>{displayKeys(key)}</kbd>
                          </button>
                        )
                      })}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </>
  )
})
