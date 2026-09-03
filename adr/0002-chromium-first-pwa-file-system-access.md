# ADR-0002: Chromium-first PWA using the File System Access API

- Status: Accepted
- Date: 2026-09-03

## Context

Folio needs direct, persistent read/write access to a user-selected local folder. The browser API for this is the File System Access API (`showDirectoryPicker()`, `FileSystemDirectoryHandle`), which Chromium browsers (Chrome, Edge, Brave) implement.

Firefox does not currently provide the same `showDirectoryPicker()` / File System Access API implementation. The older `<input type="file" webkitdirectory>` alternative exists but does not offer the same clean persistent read/write model.

## Decision

Build Folio as a **PWA** that talks to the local Markdown folder through the File System Access API, and target **Chromium-first: Chrome, Edge, Brave, etc.**

Supporting Firefox is not a reason to over-engineer the application.

## Consequences

- Full read/write/enumerate experience is available today on Chromium browsers.
- Firefox and Safari users cannot open a vault (until they ship the API); a file-picker fallback may later mitigate this but at the cost of the persistent model.
- When broader desktop support is needed, the same frontend can be packaged with Tauri rather than rearchitecting (see ADR-0003).