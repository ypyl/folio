// The transport seam between Folio's knowledge-management core and wherever
// its Markdown files live. Only the app composition layer constructs a
// VaultStorage (see ADR-0003, ADR-0013); everything else receives it via
// props or the index built from it.
//
// Path contract (ADR-0013):
//   - vault-root-relative, '/' as the separator
//   - no leading '/', no '.' or '..' segments, no absolute paths
//   - '' denotes the vault root
// Invalid paths reject rather than being sanitized. Missing files reject;
// errors propagate as the underlying error.

export interface VaultStorage {
  /** Resolve with the text content of the file at `path`. Rejects if missing. */
  read(path: string): Promise<string>
  /** Create or overwrite the file at `path`, creating missing parent dirs. */
  write(path: string, content: string): Promise<void>
  /** Create or overwrite the file at `path` with raw bytes, creating missing parent dirs. */
  writeBinary(path: string, blob: Blob): Promise<void>
  /** Remove the file at `path`. Rejects if missing. */
  delete(path: string): Promise<void>
  /** Resolve with every file under `path` (recursive), as root-relative paths; directories never appear. */
  list(path: string): Promise<string[]>
  /** Resolve with the last-modified time (ms epoch) of the file at `path`. Rejects if missing. */
  stat(path: string): Promise<number>
}
