# Folio agent probe

A local harness for the WebMCP surface Folio's experimental agent gate exposes.
It lists the tools the open page declares and calls one with the JSON you type, so
a tool call can be checked on its own. It is not an agent: the part a model would
supply, choosing the tool and filling the arguments, is the part you supply.

Everything that touches the page runs in the page's own world through
`chrome.scripting.executeScript`, because `document.modelContext` lives there. The
tool objects cannot cross into the extension, so the page looks one up by name and
calls it.

## What you need

- **Chromium 149 or later with the interface enabled.** On this machine Chrome
  157 exposes `document.modelContext` with `getTools`, `executeTool`, and
  `registerTool` after either:
  - `chrome://flags/#enable-webmcp-testing` → Enabled → Relaunch, or
  - launching Chrome with `--enable-features=WebMCP` (verified working on 157).
- **A page that declares tools.** In Folio, that means the experimental switch is
  on: the flask control on the folder rail, `aria-pressed="true"`. With it off the
  page registers nothing and this harness will truthfully say so.

## Install

Chrome no longer loads an extension from the command line, so it is the usual
unpacked path:

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. **Load unpacked**, choose this folder (`devtools/webmcp-agent`).
4. Pin it, so the toolbar icon is one press away.

The popup closes when it loses focus, like any popup. To keep it open while you
work, open it as a page instead: `chrome-extension://<id>/popup.html`.

## Use

1. Start the app: `npm run dev:test` prints the port it took, e.g.
   `http://localhost:50608/`.
2. Open it, open a folder or the guided demo, and turn the experimental switch on.
3. Click the extension. It reads the page and lists its nine tools with their
   hints (`readOnly`, `consequential`, `untrustedContent`).
4. Pick a tool; the input box fills with its required fields as JSON. Edit, then
   **Run**.

Good first calls, in the guided demo:

| Tool | Input | What to look for |
|---|---|---|
| `app_state` | `{}` | The open folder, the open page, today, and reminders due |
| `search_notes` | `{"query":"calendar"}` | At most ten rows of name, path, and kind |
| `read_note` | `{"name":"Home"}` | One page, as a line window with a character cap |
| `append_note` | `{"name":"Home","text":"From the probe."}` | The text in the open page, `agent: 1` in the status bar |
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

The surface is behind Chrome's trial flag, so this harness asks you to enable one.
When the API ships, the same tools become visible to whatever agent the browser
offers, and Gemini in Chrome is already installed on this machine; this extension
exists so the tools can be exercised before that path is generally available.
