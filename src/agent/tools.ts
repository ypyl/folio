// The tool surface's declarations (add-webmcp-tools, design D1): a name, a
// description, a JSON Schema, hints, and the action that runs. No behavior lives
// here, so the budgets a model needs are testable without a vault, and the one
// place that decides what a tool may do stays `actions.ts`.
//
// Names and descriptions stay inside the character budgets the guidance states
// (30 for a name, 500 for a description, 150 for a parameter's), because an
// agent's context is the reason the surface exists at all.

import { agentActions, type AgentDeps, type AgentError } from './actions'
import type { AgentTool } from './modelContext'

const fail = (error: AgentError, message: string) => ({ ok: false, error, message })

const NAME = {
  type: 'string',
  description: 'A page name, exactly as the app resolves it: a calendar date is a journal day.',
}

const TEXT = {
  type: 'string',
  description: 'Markdown text. It is written as given, with one empty line kept at the end.',
}

/** Run one action against the app's state at call time, so a registration made
 *  once reads the live vault rather than the one that existed when it was made. */
function runner<S extends keyof ReturnType<typeof agentActions>>(
  getDeps: () => AgentDeps | null,
  action: S,
) {
  return (input: unknown) => {
    const deps = getDeps()
    if (!deps) return fail('no-vault', 'no folder is open')
    const set = agentActions(deps) as unknown as Record<S, (input: unknown) => unknown>
    return set[action](input)
  }
}

/**
 * The surface. Read tools change nothing, write tools are consequential, and the
 * one tool that returns page text says so, because a vault holds imported and
 * pasted content and this API's hints are the only signal an agent gets.
 */
export function agentTools(getDeps: () => AgentDeps | null): AgentTool[] {
  return [
    {
      name: 'search_notes',
      description:
        "Find notes by name or content, through the app's own search ranking. Returns at most ten rows of name, path, and kind; open one to read it.",
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: "Words to find, in a note's title or its text." },
        },
        required: ['query'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: runner(getDeps, 'search'),
    },
    {
      name: 'read_note',
      description:
        'Read one page as a window of lines, by name. A calendar date reads that journal day. The result is capped, so read further with from_line.',
      inputSchema: {
        type: 'object',
        properties: {
          name: NAME,
          from_line: { type: 'number', description: 'First line to return, counting from 1.' },
          lines: { type: 'number', description: 'How many lines to return, up to 400.' },
        },
        required: ['name'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: runner(getDeps, 'read'),
    },
    {
      name: 'note_links',
      description:
        'What links to a page, what it links to, and which names it references without a page behind them.',
      inputSchema: {
        type: 'object',
        properties: { name: NAME },
        required: ['name'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: runner(getDeps, 'links'),
    },
    {
      name: 'app_state',
      description:
        "Where the app is: the open folder, the page that is open, today's journal day, and how many reminders are due on it.",
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: runner(getDeps, 'state'),
    },
    {
      name: 'open_note',
      description:
        'Open a page in the app, the way choosing it in the sidebar does. It changes no text; it shows the page.',
      inputSchema: {
        type: 'object',
        properties: { name: NAME },
        required: ['name'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: runner(getDeps, 'open'),
    },
    {
      name: 'create_note',
      description:
        'Create a page that has no text yet, from a name and its Markdown. Refused when the page already has text: append to it or edit it instead.',
      inputSchema: {
        type: 'object',
        properties: { name: NAME, text: TEXT },
        required: ['name', 'text'],
        additionalProperties: false,
      },
      annotations: { consequentialHint: true },
      execute: runner(getDeps, 'create'),
    },
    {
      name: 'edit_note',
      description:
        'Replace one exact string in a page with another. The string must occur once. A string that is missing or occurs twice changes nothing, so read the page again rather than guessing.',
      inputSchema: {
        type: 'object',
        properties: {
          name: NAME,
          old_string: { type: 'string', description: 'The exact text to replace, once.' },
          new_string: { type: 'string', description: 'The text to put in its place.' },
        },
        required: ['name', 'old_string', 'new_string'],
        additionalProperties: false,
      },
      annotations: { consequentialHint: true },
      execute: runner(getDeps, 'edit'),
    },
    {
      name: 'append_note',
      description:
        'Add Markdown at the end of a page, keeping the empty line the app ends every page with.',
      inputSchema: {
        type: 'object',
        properties: { name: NAME, text: TEXT },
        required: ['name', 'text'],
        additionalProperties: false,
      },
      annotations: { consequentialHint: true },
      execute: runner(getDeps, 'append'),
    },
    {
      name: 'add_reminder',
      description:
        "Set a page's reminder: a recurrence and the day it starts from. An existing rule for that page is replaced, and the reminder file keeps its canonical form.",
      inputSchema: {
        type: 'object',
        properties: {
          name: NAME,
          recurrence: {
            type: 'string',
            enum: ['once', 'daily', 'weekly', 'monthly', 'yearly'],
            description: 'How often the reminder comes back.',
          },
          anchor: {
            type: 'string',
            description: 'The calendar day it starts from, as YYYY-MM-DD.',
          },
        },
        required: ['name', 'recurrence', 'anchor'],
        additionalProperties: false,
      },
      annotations: { consequentialHint: true },
      execute: runner(getDeps, 'remind'),
    },
  ]
}
