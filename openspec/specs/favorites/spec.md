# Favorites

## Purpose

Favorites keep the notes a user needs close at hand at the top of the sidebar.
A favorite is a property of a page in one vault, and it travels with the folder,
not with the app.

## Requirements

### Requirement: Favorites belong to the vault

A page's favorite state SHALL live inside its vault, so it survives closing and
reopening the folder and is seen by everyone who opens that folder. Favorite
state SHALL never surface as a page, a search result, or a row of its own. The
favorites SHALL keep the order in which they were favorited, most recent first,
and a change to the stored order SHALL be reflected when the app next refreshes.

#### Scenario: Reopening a folder restores favorites

- **GIVEN** the user favorited Ideas and Vision, most recently Ideas
- **WHEN** the folder is closed and reopened
- **THEN** both pages are still favorites and Ideas sits above Vision

#### Scenario: Favorites are invisible as content

- **GIVEN** a vault with favorites
- **WHEN** the user browses the Files listing or searches
- **THEN** nothing appears for the favorite state itself

#### Scenario: No favorites means nothing created

- **WHEN** a vault has no favorites
- **THEN** the Files listing has no favorite rows and rendering the sidebar
  creates nothing in the vault

### Requirement: A page is favorited from its own row

The user SHALL favorite and unfavorite a page from that page's row, through the
row's menu, which reads "Favorite" or "Unfavorite" to match the state. A page is
either a favorite or not. The row's menu SHALL be the only place the action
lives: there SHALL be no favorite control on the row, in the status bar, or
anywhere else. Because a row exists only for a page backed by a file, the action
is available exactly for pages that exist: a journal day, a page with no file,
the search-results view, and the empty state have no favorite affordance.

#### Scenario: Favoriting a page from its row

- **WHEN** the user opens a page row's menu and activates "Favorite"
- **THEN** the page becomes a favorite, appears among the favorite rows at the
  top of the Files listing, and its menu then reads "Unfavorite"

#### Scenario: Unfavoriting returns the page to recency order

- **WHEN** the user activates "Unfavorite" for a favorite page
- **THEN** the page is no longer a favorite and returns to the non-favorite
  rows, ordered by last-modified time

#### Scenario: No favorite control besides the row menu

- **WHEN** the workspace renders with a page open
- **THEN** the status bar carries no favorite control and the row itself carries
  no icon or button for it

#### Scenario: No row means no favorite affordance

- **WHEN** the open surface is a journal day, the search-results view, or the
  empty state
- **THEN** there is no page row, and therefore no favorite action to reach

### Requirement: Favorited pages stay in the Files list, styled as favorited

Favorites SHALL remain rows in the Files listing — there SHALL be no separate
favorites section. Favorite rows SHALL be listed first, in favorite order, and
each SHALL be marked by the row's own style, a bolder title, with no icon and no
extra control. Unfavorited rows SHALL render with the normal row style.

#### Scenario: A favorite stays at the top with its style

- **WHEN** a page is favorited
- **THEN** it remains a row in the Files listing, appears at the top among
  favorite rows, and renders with a bolder title

#### Scenario: The favorite style is not a control

- **WHEN** a favorite page's row is activated
- **THEN** the row opens the page; no icon, star, or nested button appears on it

#### Scenario: Unfavorited rows render with the normal style

- **WHEN** a page is unfavorited
- **THEN** its row returns to the normal style and leaves the favorite ordering

### Requirement: A page row opens a menu of row actions

A page row in the Files listing SHALL open a menu when the user invokes the
context-menu gesture on it — a pointer right-click, or the keyboard gesture for
a context menu while the row has focus. The menu SHALL hold exactly two items:
a favorite item labelled "Favorite" or "Unfavorite" to match the state, and a
"Present" item. The menu SHALL open for page rows only: a board row, an asset
row, and a journal day cell SHALL have no menu. The row SHALL carry no visible
trigger for it.

#### Scenario: Right-clicking a page row opens the menu

- **WHEN** the user right-clicks a page row
- **THEN** the row's menu opens at the pointer

#### Scenario: The keyboard opens the menu on the focused row

- **WHEN** a page row has keyboard focus and the user invokes the context-menu
  gesture
- **THEN** the row's menu opens, positioned at the row

#### Scenario: Non-page rows have no menu

- **WHEN** the user invokes the context-menu gesture on a board row, an asset
  row, or a journal day
- **THEN** no menu opens

#### Scenario: The menu names both actions

- **WHEN** the menu opens for a page that is not a favorite
- **THEN** it holds a "Favorite" item and a "Present" item, in that order

#### Scenario: Activating Favorite toggles the state

- **WHEN** the user activates the favorite item
- **THEN** the page's favorite state toggles and the menu closes

#### Scenario: Activating Present presents the page

- **WHEN** the user activates the Present item
- **THEN** that page opens as a presentation and the menu closes

### Requirement: The row menu positions, dismisses, and operates predictably

The menu SHALL open at the gesture and SHALL stay within the viewport, shifting
to remain fully visible where it would otherwise overflow. It SHALL dismiss on
`Escape`, on activating an item, on a pointer press outside it, when the listing
scrolls, and when its row leaves the visible window; dismissing SHALL leave the
app otherwise unchanged. Opening the menu SHALL move keyboard focus into it, and
closing it SHALL return focus to its row. While it is open, the arrow keys SHALL
move between its items without wrapping, `Home` and `End` SHALL move to the
first and last item, and `Enter` or `Space` SHALL activate the focused item. The
menu SHALL expose menu semantics to assistive technology and SHALL NOT trap
focus or change the open page, the editor content, or any file.

#### Scenario: Escape dismisses and restores focus

- **GIVEN** the menu open from a row
- **WHEN** the user presses `Escape`
- **THEN** the menu closes and keyboard focus returns to that row

#### Scenario: An outside press dismisses

- **GIVEN** the menu open
- **WHEN** the user presses the pointer outside it
- **THEN** the menu closes with nothing activated

#### Scenario: Scrolling the listing dismisses

- **GIVEN** the menu open from a row in the Files listing
- **WHEN** the listing scrolls
- **THEN** the menu closes

#### Scenario: The keyboard moves between items and activates one

- **GIVEN** the menu open with its first item focused
- **WHEN** the user presses the arrow keys and then `Enter`
- **THEN** focus moves from item to item without wrapping, and the focused
  item's action runs and the menu closes

#### Scenario: The menu stays inside the viewport

- **WHEN** a row near the viewport's edge opens the menu
- **THEN** the menu's whole box is visible, shifted to fit
