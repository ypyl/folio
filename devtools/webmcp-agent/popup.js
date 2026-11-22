// A harness, not an agent: it lists what the page declares and calls one tool
// with the JSON you type. An agent would choose the tool and the arguments; that
// is the part a model supplies, and this keeps the model out of the loop so a
// tool call can be checked on its own.
//
// Everything that touches the page runs in the page's own world through
// chrome.scripting, because document.modelContext lives there: a content script's
// isolated world is a different JavaScript world, and the tool objects it sees
// would not be the ones the page registered.

const $ = (id) => document.getElementById(id)

/** The tab to act on: the active one, or the last http(s) tab in this window
 *  when the popup is opened as a page of its own (how a script drives it). */
async function targetTab() {
  const tabs = await chrome.tabs.query({ currentWindow: true })
  const pages = tabs.filter((tab) => /^https?:/.test(tab.url ?? ''))
  return pages.find((tab) => tab.active) ?? pages[pages.length - 1] ?? null
}

/** Run `func` in the page's world, with `args` serialized in. */
async function inPage(tabId, func, args) {
  const [entry] = await chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    func,
    args,
  })
  return entry?.result
}

// The page-side half: read the tools the page registered.
function readTools() {
  const context = document.modelContext
  if (!context || typeof context.getTools !== 'function') {
    return Promise.resolve({
      error:
        'This page has no document.modelContext. Enable chrome://flags/#enable-webmcp-testing, relaunch Chrome, then load the app again with the experimental switch on.',
    })
  }
  return context.getTools().then((tools) =>
    tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: tool.annotations ?? {},
    })),
  )
}

// The page-side half: call one tool by name. The tool object cannot cross into
// the extension, so the page looks it up and passes it on.
async function callTool(name, input) {
  const context = document.modelContext
  if (!context || typeof context.executeTool !== 'function') {
    return { error: 'this page has no modelContext.executeTool' }
  }
  const tools = await context.getTools()
  const tool = tools.find((one) => one.name === name)
  if (!tool) return { error: `the page does not declare a tool named ${name}` }
  const controller = new AbortController()
  try {
    return { result: await context.executeTool(tool, input, { signal: controller.signal }) }
  } catch (error) {
    return { error: String((error && error.message) || error) }
  }
}

/** A starting point for a tool's input: every required property, filled with a
 *  value of its own type, so the text can be edited rather than written. */
function inputFor(tool) {
  const schema = tool.inputSchema ?? {}
  const properties = schema.properties ?? {}
  const required = schema.required ?? Object.keys(properties)
  const sample = {}
  for (const key of required) {
    const property = properties[key] ?? {}
    if (Array.isArray(property.enum) && property.enum.length > 0) sample[key] = property.enum[0]
    else if (property.type === 'number' || property.type === 'integer') sample[key] = 1
    else if (property.type === 'boolean') sample[key] = false
    else if (property.type === 'string') sample[key] = ''
    else sample[key] = null
  }
  return JSON.stringify(sample, null, 2)
}

let selected = null

function selectTool(tool) {
  selected = tool
  for (const row of $('tools').children) {
    row.setAttribute('aria-selected', String(row.dataset.name === tool?.name))
  }
  $('input').value = tool ? inputFor(tool) : ''
  $('run').disabled = !tool
  $('input').focus()
}

function show(text, isError) {
  $('result').textContent = text
  $('result').classList.toggle('error', Boolean(isError))
}

async function loadTools() {
  $('tools').replaceChildren()
  selected = null
  $('run').disabled = true
  $('input').value = ''
  show('')

  const tab = await targetTab()
  if (!tab) {
    $('state').textContent = 'No page to read. Open the app in a tab first.'
    return
  }
  $('state').textContent = `Page: ${tab.url}`
  let tools
  try {
    tools = await inPage(tab.id, readTools)
  } catch (error) {
    $('state').textContent = `Cannot reach the page: ${error.message}`
    return
  }
  if (tools?.error) {
    $('state').textContent = tools.error
    $('state').classList.add('error')
    return
  }
  if (!Array.isArray(tools) || tools.length === 0) {
    $('state').textContent =
      'The page declares no tools. Turn the experimental switch on in the app’s folder rail.'
    return
  }
  $('state').classList.remove('error')
  $('state').textContent = `${tools.length} tools declared. Pick one.`

  for (const tool of tools) {
    const row = document.createElement('li')
    row.dataset.name = tool.name
    row.setAttribute('role', 'option')
    row.setAttribute('aria-selected', 'false')

    const name = document.createElement('div')
    name.className = 'name'
    const label = document.createElement('span')
    label.textContent = tool.name
    name.append(label)
    const chips = document.createElement('span')
    chips.className = 'chips'
    for (const [key, on] of Object.entries(tool.annotations)) {
      if (on !== true) continue
      const chip = document.createElement('span')
      chip.className = 'chip'
      chip.textContent = key.replace('Hint', '')
      chips.append(chip)
    }
    name.append(chips)
    row.append(name)

    const description = document.createElement('div')
    description.className = 'desc'
    description.textContent = tool.description
    row.append(description)

    row.addEventListener('click', () => selectTool(tool))
    $('tools').append(row)
  }
}

async function run() {
  if (!selected) return
  const tab = await targetTab()
  if (!tab) return show('No page to call.', true)
  let input
  try {
    input = $('input').value.trim() === '' ? {} : JSON.parse($('input').value)
  } catch (error) {
    return show(`Input is not JSON: ${error.message}`, true)
  }
  $('run').disabled = true
  show('Running…')
  try {
    const answer = await inPage(tab.id, callTool, [selected.name, input])
    if (answer?.error) show(answer.error, true)
    else show(JSON.stringify(answer?.result ?? null, null, 2))
  } catch (error) {
    show(String(error.message ?? error), true)
  } finally {
    $('run').disabled = false
  }
}

$('reload').addEventListener('click', () => void loadTools())
$('run').addEventListener('click', () => void run())
void loadTools()
