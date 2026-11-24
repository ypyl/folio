// The diagram engine and its render cache (add-mermaid-diagrams, design D2-D7).
// A fenced `mermaid` block is a drawing of text the page already holds, so this
// module reads no vault, writes no file, and produces nothing the Markdown
// depends on: the source text is the key, the drawing is derived, and dropping
// the cache leaves the file untouched (ADR-0001, ADR-0009).
//
// Two constraints shape it. Drawing is asynchronous while a CodeMirror widget
// builds its DOM synchronously, so a container registers and is filled later —
// the `assetImages` lifecycle moved from bytes to SVG. And `mermaid.render()` is
// a global singleton that is not reentrant, which the board editor's paste path
// shares (`@excalidraw/mermaid-to-excalidraw` calls `initialize` and `render` on
// the same module instance), so every render in the app goes through one chain
// and sets the configuration it draws with immediately before drawing (D7).
//
// The engine is fetched on the first drawing and never before (D1, spec: the
// engine loads only when a diagram is shown): the import sits behind a function,
// not at module scope, so a page with no diagram pays nothing for this module.

import type { MermaidConfig } from 'mermaid'
import { browserObserver, type ObserverFactory } from './assetImages'

/** What an observed box reports to: built by the factory, so a test can decide
 *  what is in view without a browser. */
export type Observatory = ReturnType<ObserverFactory>

/** The one thing this module needs from the engine: a source text, an SVG. */
export type DiagramEngine = {
  render(id: string, source: string): Promise<string>
}

/** What a host registers to have a drawing shown in it. */
export type Diagrams = {
  /** Show `source` in `container`, now if the drawing exists, when the
   *  container comes into view otherwise. `code` is what the engine draws, when
   *  it differs from `source`: the editor registers a whole fence (which is what
   *  the box shows when the drawing fails) and draws the block's body, while the
   *  deck hands over the body alone. Safe to call again for the same pair. */
  register(source: string, container: HTMLElement, code?: string): void
  /** Stop showing `source` in `container`; the last container releases the
   *  drawing. */
  unregister(container: HTMLElement): void
  /** Show every `mermaid` fence among `host`'s rendered code blocks (the deck,
   *  design D9): a slide is a string of HTML, so it registers here rather than
   *  through a widget. */
  sync(host: HTMLElement): void
  /** Drop every drawing this instance holds and stop observing. Idempotent. */
  release(): void
}

/** How far outside the viewport a container still counts as worth drawing. Half
 *  a screen of lead keeps fast scrolling from showing an empty box. */
const DEFAULT_ROOT_MARGIN = '50% 0px'

/** The info string a fence draws with, and the rule both mounts apply: only this
 *  language, compared ignoring letter case and surrounding space, with a body to
 *  draw. Every other fence keeps the source it has today (spec: a mermaid fence
 *  renders as a diagram). */
const DIAGRAM_LANGUAGE = 'mermaid'

export function isDiagram(info: string | null, body: string): boolean {
  if (info === null) return false
  if (info.trim().toLowerCase() !== DIAGRAM_LANGUAGE) return false
  return body.trim() !== ''
}

/** The box every drawing is shown in, and the classes inside it. Global rather
 *  than a module's, because the pane and the deck both show one. */
const BOX_CLASS = 'folio-diagram'
const SOURCE_CLASS = 'folio-diagram-source'
const NOTE_CLASS = 'folio-diagram-note'

/** What a container says when the engine refuses the source: the source itself,
 *  so the text is not lost, and one line saying why it is text (spec: a diagram
 *  that cannot be rendered keeps its source). */
const FAILED_NOTE = 'This diagram could not be drawn.'

/** The class the app's loading placeholder carries (`index.css`: warm fill, 8px
 *  radius, one pulse, stopped for reduced motion). A drawing that is on its way
 *  shows this rather than an empty box, so a wait reads as work
 *  (show-what-is-loading). */
const LOADING_CLASS = 'skeleton'
const LOADING_BOX_CLASS = 'folio-diagram-loading'

/** What a pending drawing is announced as, for a reader who cannot see the
 *  placeholder. */
const LOADING_LABEL = 'Drawing diagram'

/** The mermaid configuration the app draws with (design D6): DESIGN.md's tokens
 *  by their hex values, which cannot be read from CSS by the engine. `base`
 *  rather than a stock theme, because a stock theme cannot be reached by CSS
 *  afterwards; `strict` sanitizes label text, since a drawing is generated markup
 *  and not escaped text.
 *
 *  Its own function, applied before every render: the board editor's paste path
 *  shares this global configuration (D7), so the configuration is set by whoever
 *  is about to draw rather than once at startup. */
export function diagramConfig(): MermaidConfig {
  return {
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
    themeVariables: {
      fontSize: '14px',
      fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
      background: '#f5f4ed', // --parchment
      mainBkg: '#eef2f7', // --brand-tint
      primaryColor: '#eef2f7', // --brand-tint
      primaryTextColor: '#141413', // --near-black
      primaryBorderColor: '#1b365d', // --brand
      secondaryColor: '#e8e6dc', // --warm-sand
      tertiaryColor: '#faf9f5', // --ivory
      nodeBorder: '#1b365d', // --brand
      nodeTextColor: '#141413', // --near-black
      lineColor: '#504e49', // --olive
      textColor: '#141413', // --near-black
      titleColor: '#141413', // --near-black
      clusterBkg: '#faf9f5', // --ivory
      clusterBorder: '#e8e6dc', // --warm-sand
      edgeLabelBackground: '#f5f4ed', // --parchment
    },
  }
}

/** One engine, one chain. Every render in the app waits for the previous one, so
 *  the global configuration is set, used, and done before the next renderer
 *  touches it — the rule the board's own `mermaidExecutionQueue` exists for.
 *  The chain is module-level, not per runtime, because a page and a deck can
 *  both hold a runtime at once and the engine is shared. */
let chain: Promise<unknown> = Promise.resolve()
let counter = 0

function serialized<T>(job: () => Promise<T>): Promise<T> {
  const next = chain.then(job, job)
  chain = next.catch(() => {})
  return next
}

/** The real engine, fetched on first use. */
let loading: Promise<DiagramEngine> | null = null

function loadEngine(): Promise<DiagramEngine> {
  if (loading === null) {
    loading = import('mermaid').then(({ default: mermaid }) => ({
      render: (id: string, source: string) => {
        // Set by whoever is about to draw: the board editor's paste path writes
        // the same global configuration (D7).
        mermaid.initialize(diagramConfig())
        return mermaid.render(id, source).then((result) => result.svg)
      },
    }))
  }
  return loading
}

/** A source's drawing, and the boxes showing it. `waiting` means no box is in
 *  view yet; `queued` means a box is and the chain has not got to it. */
type Entry = {
  /** What the cache is keyed by, and what the box shows when the drawing fails. */
  source: string
  /** What the engine is asked to draw. */
  code: string
  status: 'waiting' | 'queued' | 'drawing' | 'drawn' | 'failed'
  svg: string | null
  boxes: Set<HTMLElement>
  visible: Set<HTMLElement>
}

type Options = {
  /** The scroll container whose viewport decides what is worth drawing. */
  root?: Element | null
  /** Test seam: replaces the engine. */
  engine?: DiagramEngine
  /** Test seam: replaces the viewport observer. */
  observer?: ObserverFactory
}

export function createDiagrams(options: Options = {}): Diagrams {
  const entries = new Map<string, Entry>()
  /** Which source a box was registered for, so a dropped box can release it. */
  const boxed = new WeakMap<HTMLElement, string>()
  /** The element `sync` replaced, per box it built (the deck's path): releasing
   *  this runtime puts the fence back, so a surface that stays on screen can be
   *  handed to a new runtime and drawn again (React StrictMode mounts an effect
   *  twice, and the second pass has no fence to find otherwise). */
  const synthesized = new Map<HTMLElement, HTMLElement>()
  const queue: string[] = []
  let engine: DiagramEngine | null = options.engine ?? null
  let observer: Observatory | null = null
  let released = false

  const observerFor = (): Observatory => {
    if (observer === null) {
      observer = (options.observer ?? browserObserver)(
        (target, intersecting) => {
          if (released) return
          const source = boxed.get(target as HTMLElement)
          if (source === undefined) return
          const entry = entries.get(source)
          if (!entry) return
          if (intersecting) {
            entry.visible.add(target as HTMLElement)
            need(entry)
          } else {
            entry.visible.delete(target as HTMLElement)
          }
        },
        options.root ?? null,
        DEFAULT_ROOT_MARGIN,
      )
    }
    return observer
  }

  /** Show that a box's drawing is on its way: the app's placeholder, and a busy
   *  flag so assistive technology says the block is in progress rather than
   *  empty. */
  const paintLoading = (box: HTMLElement): void => {
    box.dataset.state = 'waiting'
    box.setAttribute('aria-busy', 'true')
    box.setAttribute('aria-label', LOADING_LABEL)
    const placeholder = document.createElement('span')
    placeholder.className = `${LOADING_CLASS} ${LOADING_BOX_CLASS}`
    placeholder.setAttribute('aria-hidden', 'true')
    box.replaceChildren(placeholder)
  }

  /** Drop the busy state: whatever the box shows now is the answer. */
  const settleBox = (box: HTMLElement): void => {
    box.removeAttribute('aria-busy')
    box.removeAttribute('aria-label')
  }

  /** Write a finished drawing into one box. */
  const paint = (entry: Entry, box: HTMLElement): void => {
    box.dataset.state = 'drawn'
    settleBox(box)
    box.innerHTML = entry.svg ?? ''
  }

  /** What a box shows when the source cannot be drawn: the text, and one line
   *  saying so. Presentational only, so the press that reveals the real source
   *  still reaches the editor (spec: the text is still editable). */
  const paintFailure = (entry: Entry, box: HTMLElement): void => {
    box.dataset.state = 'failed'
    settleBox(box)
    box.textContent = ''
    const source = document.createElement('pre')
    source.className = SOURCE_CLASS
    source.textContent = entry.source
    const note = document.createElement('p')
    note.className = NOTE_CLASS
    note.textContent = FAILED_NOTE
    box.append(source, note)
  }

  /** Queue an entry's drawing once a box is in view. */
  const need = (entry: Entry): void => {
    if (released || entry.status !== 'waiting' || entry.visible.size === 0) return
    entry.status = 'queued'
    queue.push(entry.source)
    pump()
  }

  const settle = (entry: Entry): void => {
    for (const box of entry.boxes) {
      if (entry.status === 'drawn') paint(entry, box)
      else paintFailure(entry, box)
    }
  }

  function pump(): void {
    if (released) return
    while (queue.length > 0) {
      const source = queue.shift() as string
      const entry = entries.get(source)
      if (!entry || entry.status !== 'queued') continue
      // Every box left the viewport while this waited: drop it rather than
      // drawing something nobody is looking at.
      if (entry.visible.size === 0) {
        entry.status = 'waiting'
        continue
      }
      entry.status = 'drawing'
      if (engine === null) {
        const pending = loadEngine()
        pending.catch(() => {})
        pending
          .then((loaded) => {
            engine = loaded
            return drawing(entry)
          })
          .catch(() => {
            entry.status = 'failed'
            settle(entry)
            pump()
          })
        return
      }
      drawing(entry)
      return
    }
  }

  function drawing(entry: Entry): void {
    counter += 1
    const id = `folio-diagram-${counter}`
    void serialized(() => (engine as DiagramEngine).render(id, entry.code))
      .then((svg) => {
        entry.svg = svg
        entry.status = 'drawn'
        if (!released) settle(entry)
      })
      .catch(() => {
        entry.status = 'failed'
        if (!released) settle(entry)
      })
      .then(() => {
        // A drawing that finished while its boxes left still releases itself.
        if (entry.boxes.size === 0 && entry.status === 'drawn') {
          entry.svg = null
          entry.status = 'waiting'
          entries.delete(entry.source)
        }
        pump()
      })
  }

  const register = (source: string, box: HTMLElement, code?: string): void => {
    if (released) return
    let entry = entries.get(source)
    if (!entry) {
      entry = {
        source,
        // The engine draws the code, never a fence's markers: mermaid reads
        // them as an unknown diagram type.
        code: code ?? source,
        status: 'waiting',
        svg: null,
        boxes: new Set(),
        visible: new Set(),
      }
      entries.set(source, entry)
    }
    const known = boxed.get(box)
    if (known === source) return
    if (known !== undefined) unregister(box)
    boxed.set(box, source)
    entry.boxes.add(box)
    if (entry.status === 'drawn') {
      paint(entry, box)
      return
    }
    if (entry.status === 'failed') {
      paintFailure(entry, box)
      return
    }
    // Waiting: the placeholder, not an empty box of the same height.
    paintLoading(box)
    observerFor().observe(box)
  }

  const unregister = (box: HTMLElement): void => {
    const source = boxed.get(box)
    if (source === undefined) return
    boxed.delete(box)
    synthesized.delete(box)
    observer?.unobserve(box)
    const entry = entries.get(source)
    if (!entry) return
    entry.boxes.delete(box)
    entry.visible.delete(box)
    // The last box showing a drawing releases it, so what is held follows the
    // screen rather than the page. A released drawing is no longer drawn, so a
    // later box asking for the same source draws it again; a failed source keeps
    // its verdict, since nothing about scrolling makes a rejection parse.
    if (entry.boxes.size === 0) {
      if (entry.status === 'drawn') {
        entry.svg = null
        entry.status = 'waiting'
        entries.delete(source)
      }
      if (entry.status === 'waiting') entries.delete(source)
    }
  }

  const sync = (host: HTMLElement): void => {
    if (released) return
    for (const code of host.querySelectorAll('pre > code.language-mermaid')) {
      const body = code.textContent ?? ''
      if (body.trim() === '') continue
      const source = body
      const box = document.createElement('figure')
      box.className = BOX_CLASS
      box.dataset.state = 'waiting'
      const original = code.parentElement
      if (!original) continue
      original.replaceWith(box)
      synthesized.set(box, original)
      register(source, box)
    }
  }

  const release = (): void => {
    released = true
    observer?.disconnect()
    observer = null
    // A fence this runtime replaced but never drew goes back as it was found, so
    // the host is the same DOM a fresh runtime syncs over.
    for (const [box, original] of synthesized) {
      if (box.dataset.state === 'waiting') box.replaceWith(original)
    }
    synthesized.clear()
    entries.clear()
    queue.length = 0
  }

  return { register, unregister, sync, release }
}
