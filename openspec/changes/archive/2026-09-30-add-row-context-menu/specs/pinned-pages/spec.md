## REMOVED Requirements

### Requirement: User can pin and unpin the open page

**Reason**: The pin control leaves the status bar. A page's favorite state is toggled from its own row's context menu (row-context-menu capability), and the user-facing concept is renamed from "pin" to "favorite". The disabled-star cases (a journal day, the search-results view, a file-less page, no page) disappear with the control, because only a file-backed page has a row and therefore a menu.

**Migration**: To favorite a page, open its row's context menu in the Files listing and choose Favorite or Unfavorite. There is no status-bar control.

### Requirement: Pinned pages stay in the Pages list, styled as pinned

**Reason**: Renamed to favorites and respecified with the toggle in the row's context menu. The listing behavior is otherwise unchanged: favorites still remain rows in the listing and still lead it.

**Migration**: None for users. The persisted list is unchanged (see the persistence requirement). Follow "Favorited pages stay in the Files list, styled as favorited".

## ADDED Requirements

### Requirement: User can favorite and unfavorite a page from its row

A page SHALL be favorited and unfavorited from its own row in the sidebar's Files listing, through the row's context menu (row-context-menu capability). The menu's favorite item SHALL toggle the page's favorite state and SHALL read "Favorite" or "Unfavorite" to match. Favorite state SHALL be a per-page boolean from the user's point of view — a page is either a favorite or not — and SHALL be the same state the persistence requirement stores in `.folio/pins.md`. There SHALL be no status-bar control for favorite state. Because a row exists only for a file-backed page, the favorite action is available exactly for the pages that exist on disk: a journal day, a page with no file, the search-results view, and the brand empty state have no row and therefore no favorite affordance.

#### Scenario: Favoriting a page from its row

- **WHEN** the user opens a page row's context menu and activates "Favorite"
- **THEN** the page becomes a favorite, appears among the favorite rows at the top of the Files listing, its row gains the favorite style, and reopening its menu reads "Unfavorite"

#### Scenario: Unfavoriting returns the page to the recency-ordered rows

- **WHEN** the user activates "Unfavorite" for a page that is a favorite
- **THEN** the page is no longer a favorite, appears among the non-favorite rows ordered by last-modified time, and its row loses the favorite style

#### Scenario: No status-bar control

- **WHEN** the shell renders with a page open
- **THEN** the status bar carries no pin or favorite control

#### Scenario: No row means no favorite affordance

- **WHEN** the open surface is a journal day, the search-results view, or the brand empty state
- **THEN** there is no page row, and therefore no favorite action to reach

### Requirement: Favorited pages stay in the Files list, styled as favorited

Favorited pages SHALL remain rows in the Files listing — there SHALL be no separate favorites section. Favorited rows SHALL be listed first, in favorite order, and each SHALL be visually marked by the row's own style — a bolder title — with no icon and no extra control on the row. Unfavorited rows SHALL render with the normal row style. The favorite toggle SHALL live only in the row's context menu; there SHALL be no separate control for it on the row or in the status bar.

#### Scenario: A favorited page stays in the list at the top with its favorite style

- **WHEN** a page is favorited
- **THEN** it remains a row in the Files listing, appears at the top among favorite rows, and its row renders with the favorite style (bolder title)

#### Scenario: The favorite style is not a control

- **WHEN** a favorited page's row is activated
- **THEN** the row navigates to the page; no icon, star control, or nested button appears on the row

#### Scenario: Unfavorited rows render with the normal style

- **WHEN** a page is unfavorited
- **THEN** its row returns to the normal style and leaves the favorite ordering
