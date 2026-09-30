## REMOVED Requirements

### Requirement: The editor pane offers a Present control for the open page

**Reason**: Presenting moves out of the editor pane. A page is presented from its own row's context menu in the Files listing (row-context-menu capability), which names the page the deck will show and keeps the editor surface free of chrome that only some pages use. The editor pane now offers no Present control in any state.

**Migration**: To present a page, open its row's context menu in the Files listing and choose Present. This also replaces presenting a page that is not open (the app opens it first) and removes presenting a journal day or an in-memory page, which have no page row. The editor pane's `onPresent` prop and the pane's Present control are removed.
