// The Excalidraw host (add-whiteboards, design D6/D7): mounts the board editor
// for an open board, lazily. The package and its stylesheet are imported only
// when a board is first opened, so a vault that never holds a board never pays
// for the editor, and the offline install does not carry it (vite.config.ts
// excludes the chunk and its fonts from the precache).
//
// The host is deliberately thin: it turns Excalidraw's change stream into a
// scene string and reports it. The debounce and the write-through live in App,
// and the "only element changes save" rule is the pure `sceneSignature` in
// boardScene.ts. No vault import here — the editor layer stays editor-only
// (ADR-0010).

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ExcalidrawProps } from '@excalidraw/excalidraw/types'
import { parseScene, sceneSignature } from './boardScene'
import styles from './boardView.module.css'

type ExcalidrawModule = typeof import('@excalidraw/excalidraw')
type ChangeHandler = NonNullable<ExcalidrawProps['onChange']>

/** One module promise for the app's life: a second board open reuses the
 *  already-fetched chunk, and the asset path is set once. */
let modulePromise: Promise<ExcalidrawModule> | null = null

function loadExcalidraw(): Promise<ExcalidrawModule> {
  if (modulePromise === null) {
    modulePromise = Promise.all([
      import('@excalidraw/excalidraw'),
      import('@excalidraw/excalidraw/index.css'),
    ]).then(([mod]) => {
      // Where the hand-drawn fonts live (served from the package's own
      // `dist/prod/fonts` by the build; see vite.config.ts). Set before the
      // component mounts so its font loading resolves locally, never to the
      // package's CDN fallback — the app is offline-capable.
      ;(window as unknown as { EXCALIDRAW_ASSET_PATH?: string }).EXCALIDRAW_ASSET_PATH =
        `${import.meta.env.BASE_URL}excalidraw-assets/`
      return mod
    })
  }
  return modulePromise
}

export function BoardView({
  initialScene,
  onChange,
}: {
  /** The board file's text, or '' for a board that has never been saved. */
  initialScene: string
  /** Called with the serialized scene when the board's elements change. */
  onChange: (scene: string) => void
}) {
  const [mod, setMod] = useState<ExcalidrawModule | null>(null)
  const [failed, setFailed] = useState(false)
  // Frozen on mount: Excalidraw reads initialData once, and App keys this
  // component by board path, so a board switch remounts rather than mutating.
  const [initialData] = useState(() => parseScene(initialScene))
  const lastSignature = useRef<string | null>(null)
  const changeRef = useRef(onChange)
  useEffect(() => {
    changeRef.current = onChange
  })

  useEffect(() => {
    let alive = true
    loadExcalidraw()
      .then((loaded) => {
        if (alive) setMod(loaded)
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [])

  const handleChange = useCallback<ChangeHandler>(
    (elements, appState, files) => {
      const signature = sceneSignature(elements)
      // The first emit is the mount's own load, not an edit; and an unchanged
      // signature is a camera-only change, which never saves (design D7).
      if (signature === lastSignature.current) return
      const first = lastSignature.current === null
      lastSignature.current = signature
      if (first || mod === null) return
      changeRef.current(mod.serializeAsJSON(elements, appState, files, 'local'))
    },
    [mod],
  )

  if (failed) {
    return (
      <div className={styles.board} data-board-error="true">
        <p className={styles.notice}>The board editor could not be loaded.</p>
      </div>
    )
  }
  if (mod === null) {
    return <div className={styles.board} data-board-loading="true" aria-busy="true" />
  }
  const { Excalidraw } = mod
  return (
    <div className={styles.board} data-board-host="true">
      <Excalidraw
        initialData={initialData as ExcalidrawProps['initialData']}
        onChange={handleChange}
      />
    </div>
  )
}
