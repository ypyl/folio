// The app tour's steps (add-app-tour). One step per shell region, in the order
// the regions are read: the folder rail, the sidebar, the editor area, the
// right panel, and the status bar. Each `target` is a CSS selector for the
// region's boxed element — the `.view-layer` wrappers are `display: contents`
// on wide viewports and have no box to measure — and `side` is where the card
// prefers to sit relative to that region (it flips and clamps when there is no
// room). The copy is state-neutral: it reads correctly with no folder and no
// page open, which is when a first run is most likely to open the tour.

/** Which side of its region a step's card prefers. */
export type TourSide = 'right' | 'left' | 'top' | 'bottom' | 'center'

export type TourStep = {
  /** A CSS selector for the region the step names. */
  target: string
  title: string
  body: string
  side: TourSide
}

export const TOUR_STEPS: TourStep[] = [
  {
    target: '#folder-rail',
    title: 'Your folders',
    body: 'Opened folders sit here. The mark goes home, the magnifier searches, and + opens another folder. The ? at the bottom reopens this tour.',
    side: 'right',
  },
  {
    target: '#sidebar-pane',
    title: 'Journal and Files',
    body: 'The calendar marks days that have a note, and Files lists every page, board, and file in the open folder.',
    side: 'right',
  },
  {
    target: '[data-tour="editor"]',
    title: 'Your page',
    body: 'Pages open here as plain Markdown and save as you type. Type #word or #[[Page]] to reference a page, and #!word for a board; referencing something new creates it on first save.',
    side: 'center',
  },
  {
    target: '#meta-panel',
    title: 'Outline and links',
    body: "Contents mirrors the page's headings, and Links lists the pages that reference this one and the pages it references. The keyboard-shortcuts reference waits at the bottom.",
    side: 'left',
  },
  {
    target: '[data-tour="status"]',
    title: 'Getting around',
    body: "Back and Forward walk the pages you have visited, and Today opens the current day's journal. The far end names the open folder and its file count.",
    side: 'top',
  },
]
