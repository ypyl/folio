## ADDED Requirements

### Requirement: The shell shows an app-level status bar
The shell SHALL render a thin status bar as a full-width row below the workspace, present in every app state — with a vault open, while the index builds, on search-results surfaces, and on the brand empty state. The bar SHALL hold three groups and a control: the open page's file path as a breadcrumb (left), a status group holding the save-state text and the indexing label (immediately after the breadcrumb, separated from it by a vertical hairline), the active vault's name and file count (right side), and a small question-mark help button (far right corner, after the vault's name and file count). A group SHALL be empty when its content has no source: no page open leaves the path group empty; a page with nothing to report leaves the status group empty; no active folder leaves the vault group empty. The help button SHALL be reachable from every state, including the brand empty state. The bar SHALL sit outside all pane scroll regions — its content never scrolls, and the panes scroll independently beneath it — and SHALL use Kami tokens (stone 12px text, hairline top border, flat surfaces). The bar SHALL NOT perform actions beyond the help button: it opens no picker, switches no folder, re-grants no permission, and navigates nowhere.

#### Scenario: The bar frames every app state
- **GIVEN** the app on the brand empty state with no vault open
- **WHEN** the shell renders
- **THEN** the status bar is present with only the question-mark help button filled in

#### Scenario: An open page fills the path group
- **WHEN** the user opens a page
- **THEN** the status bar's path group shows the page's file-path breadcrumb

#### Scenario: The indexing label shows in the bar
- **WHEN** the active folder's index is building
- **THEN** the status bar shows the "Indexing notes…" status in the center group

#### Scenario: The bar performs no actions
- **WHEN** the user activates the breadcrumb segments, the status text, or the vault name in the status bar
- **THEN** nothing happens: no navigation, no picker, no folder switch, no permission re-grant

#### Scenario: The bar stays put while panes scroll
- **WHEN** the user scrolls a pane beneath the status bar
- **THEN** the bar and its content remain fixed at the shell's bottom

## MODIFIED Requirements

### Requirement: Header shows brand, content-width search, and an active-vault status slot
The header SHALL show the Folio brand at the left and a search input centered over and spanning the center pane's column. The header's right slot SHALL be empty: the vault's name and file count and the question-mark help button moved to the status bar. The slot SHALL hold no controls and SHALL NOT open a picker, switch folders, or re-grant permission — adding, switching, or re-granting a folder happens on the folder rail. The search input's width SHALL match the content column it sits over (capped at a readable maximum), not a fixed narrow box, so the box and its dropdown align with the content beneath. Search behavior — the results dropdown, matching, keyboard, and edge states — is specified by the search capability.

#### Scenario: Search spans the content column
- **WHEN** the shell renders at desktop width
- **THEN** the search input is horizontally aligned with the center pane and spans that column's width, not a fixed-width box

#### Scenario: Search behavior lives with the search capability
- **WHEN** the user types into the search input
- **THEN** the input's behavior is the search capability's: a results dropdown, keyboard shortcuts, and empty states, none of which were present while the input was inert

#### Scenario: The slot shows status and performs no actions
- **WHEN** a vault is active
- **THEN** the header slot shows no controls — the vault's name and file count appear in the status bar instead — and the slot performs no other actions: it opens no picker, switches no folder, and re-grants no permission

### Requirement: A question-mark button opens a keyboard-shortcuts reference
The status bar's question-mark button SHALL open a modal dialog over the shell that lists the app's keyboard shortcuts: the editor's formatting and editing shortcuts (bold, italic, inline code, undo, redo, heading levels, paragraph, ordered and bullet lists, blockquote, code block, indent and outdent, line break) and the app's search shortcut. The dialog SHALL list only shortcuts the app actually provides, and SHALL show each as a readable label with its key combination. The dialog SHALL close when the user presses Escape, activates a close control, or activates the area outside the dialog (its scrim). Opening the dialog SHALL move keyboard focus into it; closing SHALL return focus to the question-mark button. The dialog SHALL be exposed to assistive technology as a dialog.

#### Scenario: The button opens the reference
- **WHEN** the user activates the question-mark help button in the status bar
- **THEN** a modal dialog listing the app's keyboard shortcuts opens over the shell

#### Scenario: The reference lists only real shortcuts
- **WHEN** the shortcuts dialog is open
- **THEN** it lists the editor's formatting and editing shortcuts and the app's search shortcut, and lists no shortcut for capabilities that provide none (such as links)

#### Scenario: Escape closes and returns focus
- **WHEN** the shortcuts dialog is open and the user presses Escape
- **THEN** the dialog closes and keyboard focus returns to the question-mark button

#### Scenario: Clicking outside the dialog closes it
- **WHEN** the shortcuts dialog is open and the user activates an area of the scrim outside the dialog
- **THEN** the dialog closes

#### Scenario: The dialog is accessible
- **WHEN** the shortcuts dialog is open
- **THEN** it is exposed to assistive technology as a dialog, and opening it moves keyboard focus into the dialog

### Requirement: Panes show loading placeholders while the index builds
While the active folder's index is being built — when a folder is first opened, when the user switches to another listed folder, and when a stored folder's permission is re-granted — the shell SHALL show loading placeholders in the panes whose content derives from the index, replacing the empty content those panes would otherwise show. The editor pane SHALL show placeholder body lines in place of its notes hint, the sidebar SHALL show placeholder rows in place of the Journal and Pages listings, and the meta panel SHALL show placeholder rows in its Backlinks and Forwardlinks sections in place of their placeholder copy. The loading state SHALL be announced to assistive technology as an in-progress status labeled "Indexing notes…" in the status bar, and the placeholder blocks themselves SHALL be purely decorative. The loading state SHALL end when the active folder's index resolves, at which point the panes SHALL render the folder's real content and all post-index behavior is unchanged: the today journal opens in the editor, the sidebar lists the folder's pages, and search enables. While no folder is active, the shell SHALL show the brand empty state, never loading placeholders.

#### Scenario: Opening a folder shows loading placeholders
- **WHEN** a folder whose index takes measurable time to build is opened
- **THEN** the editor pane, sidebar, and meta panel show loading placeholders instead of empty content, and they keep showing them until the index resolves

#### Scenario: The meta panel shows loading placeholders
- **WHEN** the active folder's index is building and no page is open
- **THEN** the Backlinks and Forwardlinks sections show placeholder rows instead of their placeholder copy

#### Scenario: Switching folders re-enters the loading state
- **WHEN** the user activates a second listed folder while one is open
- **THEN** the panes show loading placeholders while the new folder's index builds, and the placeholder content is replaced by the new folder's pages once the index resolves

#### Scenario: Loading ends with real content
- **WHEN** the active folder's index resolves after its loading state was showing
- **THEN** the placeholders are gone, the editor opens the folder's today journal, the sidebar lists the folder's pages, and search is enabled

#### Scenario: No placeholders while no folder is active
- **WHEN** no folder is active, including after the user returns home via the brand
- **THEN** the shell shows the brand empty state and no loading placeholders

#### Scenario: Loading placeholders are announced, not read as content
- **WHEN** the panes are showing loading placeholders
- **THEN** the status bar shows an in-progress status labeled "Indexing notes…", and the placeholder blocks themselves are not read as page or note content