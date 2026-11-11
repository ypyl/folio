# Proposal

## Why

The compact shell now works on a phone, but it still reads as a desktop window:
the editor is 15 px, list rows are 14 px, section labels 11 px, weekdays and
badges 10 px, and the panes sit 8 px from the edge. Mobile defaults are 16 px
body text, 12 px minimum labels, 48 px targets, and 16 px margins. The two
icon-only view controls in the bottom bar are unlabeled and mix status with
navigation, and no view shows the page title. On the installed PWA a cold start
also costs four actions to re-open the folder, because the stored permission
comes back as `prompt`.

A Pixel 9a audit of build 0.88.2 measured all of this, and the design review
(`.tmp/answers/folio-phone-design.html`) compared it with Material 3, Apple HIG,
WCAG 2.2 and web.dev.

## What Changes

- **A compact type scale**: 16 px body and editor text, 20 px editor headings,
  16 px list rows and buttons, 14 px calendar numbers and secondary copy,
  12 px section labels and status text, 11 px badges, 24 px icons. Nothing in
  the compact shell stays below 11 px.
- **48 px targets and 16 px margins**: every compact control reaches 48 by 48
  (the app bar, rail, rows, summaries, menus, search, shortcuts, presentation),
  list rows are 52 px, and the navigation panes pad to 16 px from the edge. The
  calendar's seven-column grid is the one exception: cells are 48 px tall and as
  wide as the column share allows (above the 44 px floor).
- **A 56 px top app bar on every compact view.** It carries the view's title, a
  leading control (the list from the editor, the page from the list and from
  Details), and, on the editor view, a page-actions overflow. The overflow holds
  Favorite/Unfavorite, Remove reminder, Present, and Details, the same actions
  the page row's menu holds. The title is the open item's name and works as the
  locate control the status bar's crumb used to be.
- **The status bar becomes a 32 px status line at compact**: the save state
  only. The two icon view controls leave it, along with the ambiguous toggle
  between the navigation and meta views.
- **The brand screen offers the stored folder.** When a stored folder is active
  but its permission is pending, the screen leads with `Continue with <name>`
  (one tap, then the system Allow), then a secondary picker action, the demo,
  and the import.
- **A richer install**: the manifest gains an `id`, `categories`, and narrow
  screenshots, so Android shows the app's own screens when it offers the
  install.
- **`DESIGN.md` records the compact scale, targets, margins, and the app bar /
  status line**, so the next compact surface follows them.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace`: the compact shell's composition (top app bar, status line, no
  view toggles), its landing and view history controls, the touch-target rule
  raised to 48 px with the type scale and margins stated, the brand screen's
  reconnect action, and the status bar's compact content.

## Non-goals

- **No list-to-page stack and no drawer.** The rail and sidebar stay the
  navigation view (option C in the review); this change is option B with the
  redundant tab bar dropped.
- **No details sheet.** Details stays a view behind the top bar.
- **No new page action.** Pages are still created by references, as the app
  intends.
- **No wide-composition change.** The desktop type sizes, pointer targets, and
  three-pane layout stay as they are.
- **No dark mode, no new font, and no dependency.**
- **No experimental switch.** This completes the shipped compact shell; it adds
  no capability that needs gating (the same rule the previous phone change took).
- **No text-scaling rewrite.** The scale uses px inside a documented phone
  scale; a 200% text-scaling pass is a separate accessibility change.

## Impact

- **`src/components/StatusBar.tsx` / `.css`** — the compact status line, and the
  view controls removed.
- **A new app bar component** for the compact views, and **`src/App.tsx`** for
  its title, leading control, overflow actions, and Details navigation; the
  brand screen's reconnect action; the row stride (52 px rows).
- **`src/components/` stylesheets** — the type scale, 48 px targets, 16 px
  margins, calendar cells.
- **`src/editor/codemirror.ts` or a compact override** — the 16 px editor body
  and 20 px headings on a phone.
- **`vite.config.ts`**, `public/` — the manifest id, categories, and screenshots.
- **`DESIGN.md`**, tests (integration for the app bar, reconnect, and compact
  composition; e2e for sizes, the app bar, and the install manifest), version
  (minor: a phone-facing redesign).
