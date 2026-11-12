// The app tour's steps (add-app-tour, tour-lives-in-the-demo). One step per
// shell region, in the order the regions are read: the folder rail, the sidebar,
// the editor area, the right panel, and the status bar. Each `target` is a CSS
// selector for the region's boxed element — the `.view-layer` wrappers are
// `display: contents` on wide viewports and have no box to measure — and `side`
// is where the card prefers to sit relative to that region (it flips and clamps
// when there is no room). The tour is opened only from the guided demo's rail, so
// the copy may name the demo vault and the rail's `?` as things the reader has
// in front of them.

/** Which side of its region a step's card prefers. */
export type TourSide = 'right' | 'left' | 'top' | 'bottom' | 'center'

type TourStep = {
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
    body: "The JOURNAL row carries Back and Forward, which walk what you have visited, and Today, which opens the current day's journal. The calendar marks days that have a note, and Files lists every page, board, and file in the open folder.",
    side: 'right',
  },
  {
    target: '[data-tour="editor"]',
    title: 'Your page',
    body: 'Pages open here as plain Markdown and save as you type. Type #word or #[[Page]] to reference a page, and #!word for a board. This is the guided demo: a worked example of every feature.',
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
    body: 'The bar names the open item, reports whether it is saved, and names the open folder and its file count at the far end.',
    side: 'top',
  },
]
