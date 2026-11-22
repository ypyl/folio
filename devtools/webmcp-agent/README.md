# Folio agent probe

A local harness for the WebMCP surface Folio's experimental agent gate exposes.
It lists the tools the open page declares and calls one with the JSON you type, so
a tool call can be checked on its own. It is not an agent: the part a model would
supply, choosing the tool and filling the arguments, is the part you supply.

Everything that touches the page runs in the page's own world through
`chrome.scripting.executeScript`, because `document.modelContext` lives there. The
tool objects cannot cross into the extension, so the page looks one up by name and
calls it.

## Edge, which is what this is written for

Verified on Microsoft Edge 157.0.4341.60. The interface is **off by default** in
Edge's build and needs the feature turned on at launch:

- `edge://flags/#enable-webmcp-testing` → **Enabled** → **Restart**, or
- launch Edge with the feature flag, which is what `edge-webmcp.cmd` in this folder
  does: `msedge.exe --enable-features=WebMCP`.

A running browser ignores the flag, so Edge has to be restarted. Tabs are restored,
so reopening the app is one click.

The same recipe works on Chrome 149 and later (`chrome://flags/#enable-webmcp-testing`,
or `--enable-features=WebMCP`). Firefox and Safari have no such interface, and the
harness will say so.

## Install

1. Open `edge://extensions` (or `chrome://extensions`).
2. Turn on **Developer mode**.
3. **Load unpacked**, choose this folder (`devtools/webmcp-agent`).
4. Pin it, so the toolbar icon is one press away.

Edge also loads it from the command line
(`msedge.exe --load-extension="<this folder>"`), which is handy for a throwaway
profile; branded Chrome 137 and later ignores that switch, so the unpacked path is
the one to rely on.

## The origins it can touch

The manifest names them, and nothing else:

- `http://localhost/*` and `http://127.0.0.1/*` — the dev server and any other local
  build. Vite's `--port 0` picks a new port each run, which these patterns cover.
- `https://ypyl.github.io/*` — the live build.

The popup can be opened as a toolbar popup or as a page
(`edge-extension://<id>/popup.html`); both work, because the permission is a host
permission rather than the click-scoped `activeTab`.

## Use

1. Start the app: `npm run dev:test` prints the port it took, e.g.
   `http://localhost:61465/`.
2. Open it, open a folder or the guided demo, and turn the experimental switch on
   (the flask control on the folder rail, `aria-pressed="true"`).
3. Click the extension. It reads the page and lists its nine tools with their hints
   (`readOnly`, `consequential`, `untrustedContent`).
4. Pick a tool; the input box fills with its required fields as JSON. Edit, then
   **Run**.

Good first calls, in the guided demo:

| Tool | Input | What to look for |
|---|---|---|
| `app_state` | `{}` | The open folder, the open page, today, and reminders due |
| `search_notes` | `{"query":"calendar"}` | At most ten rows of name, path, and kind |
| `read_note` | `{"name":"Home"}` | One page, as a line window with a character cap |
| `append_note` | `{"name":"Home","text":"From the probe."}` | The text in the open page, `agent: 1` in the status bar |
| `create_note` | `{"name":"Edge note","text":"From Edge."}` | A new row in Files, with no reload |
| `edit_note` | `{"name":"Home","old_string":"…","new_string":"…"}` | One transaction in the open document; `Ctrl+Z` takes it back |
| `add_reminder` | `{"name":"Home","recurrence":"weekly","anchor":"2026-11-24"}` | `.folio/reminders.md` keeps its header and canonical form |

What to check while you do it:

- **The page you are looking at changes.** On the open page the edit arrives as a
  transaction: your caret stays, your typing is kept, and `Ctrl+Z` undoes the
  agent's change without touching yours.
- **A page you are not looking at still updates the app.** `create_note` then open
  it from Files: the row is there already, and so are its backlinks.
- **The record names it.** The status bar's `agent: N` panel lists the tool and the
  path. That panel is the whole acceptance mechanism; there is no revert.
- **Refusals are loud.** A stale `old_string` answers `not-found` and writes
  nothing. `.folio/pins.md` answers `refused-path`. A page that already has text
  answers `exists` to `create_note`.
- **Turning the switch off retires the surface.** Click **Reload tools**: the page
  declares nothing, so the list is empty.

## Why this is not the shipping experience

The surface is behind a browser feature flag, so this harness asks you to enable
one. When the API ships, the same tools become visible to whatever agent the
browser offers, and Edge's Copilot and Gemini in Chrome are already installed here;
this extension exists so the tools can be exercised before that path is generally
available.
