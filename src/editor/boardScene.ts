// Board scene helpers (add-whiteboards, design D7): the pure part of the
// Excalidraw host, kept out of the React component so the "only element changes
// save" rule is testable without a browser. A board's scene is the JSON the
// Excalidraw component serializes; the camera (pan/zoom) lives in `appState`
// and is deliberately not a save trigger.

/** The minimal shape a signature reads from an element. Excalidraw's own
 *  element type is far larger; the host never needs more than identity and
 *  version to tell a real edit from a camera move. */
export type SceneElement = { id: string; version?: number }

/** What Excalidraw's `initialData` / `serializeAsJSON` round-trip. */
export type BoardScene = {
  elements: unknown[]
  appState: Record<string, unknown>
  files: Record<string, unknown>
}

/** The canvas background a board with none of its own opens on
 *  (board-default-background): Kami's `--parchment` token from `DESIGN.md`, so
 *  a new board is not the one pure-white surface in a warm-parchment app.
 *  Excalidraw's own default is `#ffffff`, which the design language bans. */
export const DEFAULT_BOARD_BACKGROUND = '#f5f4ed'

/** A cheap content signature: identity plus version per element. Excalidraw
 *  bumps `version` on any real element change (draw, move, resize, delete) and
 *  leaves it alone while the canvas is panned or zoomed, so an unchanged
 *  signature is exactly a camera-only change — the one the app must not save. */
export function sceneSignature(elements: readonly SceneElement[]): string {
  let signature = ''
  for (const element of elements) {
    signature += `${element.id}:${element.version ?? 0};`
  }
  return signature
}

/** Parse a board file's text into the scene Excalidraw mounts. An empty or
 *  unparseable file is a blank board rather than an error: a board may be
 *  created from a reference before it holds anything, and a file written by
 *  another tool must never take the app down. */
export function parseScene(scene: string): BoardScene {
  if (scene.trim() === '') return withDefaultBackground({ elements: [], appState: {}, files: {} })
  try {
    const data = JSON.parse(scene) as Partial<BoardScene>
    return withDefaultBackground({
      elements: Array.isArray(data.elements) ? data.elements : [],
      appState: data.appState ?? {},
      files: data.files ?? {},
    })
  } catch {
    return withDefaultBackground({ elements: [], appState: {}, files: {} })
  }
}

/** Give the scene the app's parchment canvas background when it names none
 *  (board-default-background). A board that already carries a
 *  `viewBackgroundColor` — saved earlier, or changed with the editor's picker —
 *  is returned untouched, so the default can never overwrite a user's choice. */
function withDefaultBackground(scene: BoardScene): BoardScene {
  if (scene.appState.viewBackgroundColor != null) return scene
  return {
    ...scene,
    appState: { ...scene.appState, viewBackgroundColor: DEFAULT_BOARD_BACKGROUND },
  }
}
