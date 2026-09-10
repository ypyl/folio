import { useId } from 'react'
import { SHORTCUT_GROUPS, displayKeys } from './shortcuts'
import styles from './ShortcutsList.module.css'

// The keyboard-shortcuts reference body (move-help-to-right-panel). Pure
// content: it renders SHORTCUT_GROUPS as labelled groups of label + key chips,
// with no shell chrome of its own — the right meta panel's accordion supplies
// the disclosure. No heading elements: the app's chrome has none (accordion
// titles are <summary>), so a <p> labelled section carries the same grouping
// for assistive technology without planting an orphaned heading level.
export function ShortcutsList() {
  // One id namespace per instance; group labels address their own section.
  const baseId = useId()

  return (
    <>
      {SHORTCUT_GROUPS.map((group, index) => {
        const labelId = `${baseId}-group-${index}`
        return (
          <section key={group.heading} className={styles.group} aria-labelledby={labelId}>
            <p id={labelId} className={styles.groupHeading}>
              {group.heading}
            </p>
            <ul className={styles.list}>
              {group.items.map((item) => (
                <li key={item.label} className={styles.row}>
                  <span className={styles.label}>{item.label}</span>
                  <span className={styles.keys}>
                    {item.keys.map((key) => (
                      <kbd key={key} className={styles.kbd}>
                        {displayKeys(key)}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </>
  )
}
