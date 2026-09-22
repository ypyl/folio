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

/** The tools that show a crosshair over the canvas (board-drawing-cursor):
 *  every tool except the ones the editor gives a cursor of its own. Mirrors the
 *  library's own rule — selection clears the cursor, hand grabs, eraser draws
 *  its circle, laser its custom SVG, image and custom tools sit at `auto` — so
 *  the app's crosshair appears for exactly the tools a stock crosshair would. */
const CURSORED_TOOLS = new Set(['selection', 'hand', 'eraser', 'laser', 'image', 'custom'])

function usesCrosshair(type: string | undefined): boolean {
  return type !== undefined && !CURSORED_TOOLS.has(type)
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
  // Tool-aware cursor (board-drawing-cursor): the library sets the stock
  // crosshair keyword on the canvas inline, so the stylesheet swaps in the
  // app's cursor only while the active tool is one that shows a crosshair. The
  // host carries the flag; the refs keep the write to when the tool's class
  // actually changes, never per pointer move.
  const hostRef = useRef<HTMLDivElement>(null)
  const crosshair = useRef<boolean | null>(null)
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
      const wantsCrosshair = usesCrosshair(appState.activeTool?.type)
      if (wantsCrosshair !== crosshair.current) {
        crosshair.current = wantsCrosshair
        hostRef.current?.toggleAttribute('data-crosshair', wantsCrosshair)
      }
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
  const { Excalidraw, MainMenu } = mod
  return (
    <div className={styles.board} data-board-host="true" ref={hostRef}>
      <Excalidraw
        initialData={initialData as ExcalidrawProps['initialData']}
        onChange={handleChange}
      >
        {/* The editor's default main menu carries its own project's links
            (GitHub, X, Discord) under an "Excalidraw links" group. Folio is not
            that project, so the host supplies the library's own MainMenu — the
            supported customization seam — with the same items and without that
            group. No UIOptions is passed, so the library's defaults (export and
            save-as-image on) always apply and those items are unconditional. */}
        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.SaveToActiveFile />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.SearchMenu />
          <MainMenu.DefaultItems.Help />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.Separator />
          <MainMenu.DefaultItems.ToggleTheme />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
      </Excalidraw>
    </div>
  )
}
