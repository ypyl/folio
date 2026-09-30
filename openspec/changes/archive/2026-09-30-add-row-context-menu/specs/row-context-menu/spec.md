## Purpose

Lets a user act on a page in the Files listing through a context menu, without adding controls to the row itself: favorite or unfavorite the page, or present it as a slide deck.

## ADDED Requirements

### Requirement: A page row opens a context menu

A page row in the sidebar's Files listing SHALL open a context menu when the user invokes the context-menu gesture on it — a pointer right-click, or the browser's keyboard gesture for a context menu (`Shift+F10` or the Menu key) while the row has focus. The menu SHALL open for page rows only. A board row and an asset row SHALL have no context menu, and invoking the gesture on one SHALL leave the app's own menu closed (the browser's default menu is suppressed only where the app provides its own). A journal day cell in the Journal section SHALL have no context menu. The row SHALL carry no visible trigger for the menu: no button, icon, or marker is added to the row for it.

#### Scenario: Right-clicking a page row opens the menu

- **GIVEN** an open vault whose Files listing holds a page row
- **WHEN** the user right-clicks the page row
- **THEN** the row's context menu opens at the pointer

#### Scenario: The keyboard opens the menu on the focused row

- **WHEN** a page row has keyboard focus and the user presses `Shift+F10` or the Menu key
- **THEN** the row's context menu opens, positioned at the focused row

#### Scenario: Non-page rows have no menu

- **WHEN** the user invokes the context-menu gesture on a board row, an asset row, or a journal day cell
- **THEN** no app context menu opens

#### Scenario: The row gains no trigger

- **WHEN** the Files listing renders a page row
- **THEN** the row shows only its label, with no menu button, icon, or other added control

### Requirement: The menu offers Favorite/Unfavorite and Present

The context menu SHALL hold exactly two items, in this order: a favorite item labelled **Favorite** when the page is not a favorite and **Unfavorite** when it is, and a **Present** item. The favorite item SHALL reflect the page's current favorite state and SHALL toggle it when activated (pinned-pages capability). The Present item SHALL present the page it names (presentations capability). The menu SHALL hold no other items, and SHALL NOT be a general-purpose menu: no submenus, separators, item registry, or per-item configuration.

#### Scenario: The menu names both actions

- **WHEN** the context menu opens for a page that is not a favorite
- **THEN** it holds exactly a "Favorite" item and a "Present" item, in that order

#### Scenario: The favorite item reflects state

- **WHEN** the context menu opens for a page that is already a favorite
- **THEN** the favorite item reads "Unfavorite"

#### Scenario: Activating Favorite toggles the state

- **GIVEN** the context menu open for a page that is not a favorite
- **WHEN** the user activates the Favorite item
- **THEN** the page becomes a favorite, its row shows the favorite style, and the menu closes

#### Scenario: Activating Present presents the page

- **GIVEN** the context menu open for a page row
- **WHEN** the user activates the Present item
- **THEN** that page opens as a presentation and the menu closes

### Requirement: The menu positions, dismisses, and operates predictably

The menu SHALL open near the gesture — at the pointer for a right-click, at the focused row for a keyboard invocation — and SHALL stay within the viewport, shifting to remain fully visible where it would otherwise overflow. It SHALL dismiss on `Escape`, on activating one of its items, on a pointer press outside it, when the Files listing scrolls, and when its row leaves the rendered window; dismissing SHALL leave the app otherwise unchanged. The menu SHALL expose menu semantics to assistive technology: the row SHALL advertise that it has a context menu, and the menu SHALL present its items as menu items with names that state their actions. Opening the menu SHALL move keyboard focus into it, and closing it SHALL return focus to the row it belongs to. While the menu is open, `ArrowDown` and `ArrowUp` SHALL move between its items without wrapping, `Home` and `End` SHALL move to the first and last item, and `Enter` or `Space` SHALL activate the focused item. The menu SHALL not trap focus and SHALL not change the open page, the editor content, or any file merely by opening or closing.

#### Scenario: Escape dismisses and restores focus

- **GIVEN** the context menu open from a row
- **WHEN** the user presses `Escape`
- **THEN** the menu closes and keyboard focus returns to that row

#### Scenario: An outside press dismisses

- **GIVEN** the context menu open
- **WHEN** the user presses the pointer outside the menu
- **THEN** the menu closes with nothing activated

#### Scenario: Scrolling the listing dismisses

- **GIVEN** the context menu open from a row in the Files listing
- **WHEN** the Files listing scrolls
- **THEN** the menu closes

#### Scenario: Arrow keys move between items

- **GIVEN** the context menu open with its first item focused
- **WHEN** the user presses `ArrowDown`
- **THEN** focus moves to the second item and stops there when it is the last

#### Scenario: Keyboard activation runs the item

- **GIVEN** the context menu open with an item focused
- **WHEN** the user presses `Enter` or `Space`
- **THEN** that item's action runs and the menu closes

#### Scenario: The menu stays inside the viewport

- **WHEN** a row near the viewport's edge opens the menu
- **THEN** the menu's whole box is visible, shifted to fit

### Requirement: The menu adds nothing to the editor's typing cost

Opening or closing the context menu SHALL NOT add work to the editor's per-keystroke path: the menu SHALL be driven by state that changes only when it opens, closes, or moves focus within it, and a keystroke in the open page SHALL NOT create, position, or re-render the menu or any row's handlers. The handlers a row carries for the menu SHALL keep the same identity across keystrokes, so the sidebar's memoization is not defeated.

#### Scenario: Typing does not touch the menu

- **GIVEN** a vault with a page open and a context menu that has been opened and dismissed
- **WHEN** the user types in the editor
- **THEN** the work per keystroke is the same as before the menu existed, and no menu is created or positioned
