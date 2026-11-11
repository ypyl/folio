# Spec Delta

## REMOVED Requirements

### Requirement: The no-folder screen offers a one-time Logseq import

**Reason**: The import leaves the app for a repository script; the no-folder screen no longer hosts an import flow.

**Migration**: `npm run import:logseq -- <logseq-folder> <folio-vault>`.

### Requirement: Import reads a source and writes a destination

**Reason**: The flow's two pickers and its write path live in the script now.

**Migration**: The script takes the two folders as arguments.

### Requirement: Import translates Logseq conventions into Folio Markdown

**Reason**: The transform is unchanged, but it is no longer app behavior; the script runs it.

**Migration**: See `MIGRATION_LOGSEQ_FOLIO.md`, still the rules' reference.

### Requirement: Import merges without overwriting

**Reason**: The merge behavior moves with the transform into the script.

**Migration**: The script calls the same `runLogseqImport`.

### Requirement: Import records the source files it has imported

**Reason**: The ledger is still written, by the script, into the destination's `.folio/imports.md`.

**Migration**: Re-run the script; it appends only fresh sources.

### Requirement: Import reports progress while it runs

**Reason**: A terminal one-shot has no progress pane; the script prints phases and a final report.

**Migration**: Read the command's output.

### Requirement: Import summarizes the result and opens the destination

**Reason**: The script summarizes; it does not open the destination in the app.

**Migration**: Open the destination folder in Folio as an ordinary vault.

### Requirement: Import ignores non-content Logseq data

**Reason**: The transform keeps this rule; only the in-app flow is removed.

**Migration**: No action; the script holds the same rule.

### Requirement: Import fails safely

**Reason**: The transform keeps its failure handling; the script surfaces the error and a non-zero exit.

**Migration**: Re-run after fixing the cause; the ledger keeps completed work.
