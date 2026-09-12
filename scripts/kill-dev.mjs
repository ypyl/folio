// Kill the dev and test servers this repo leaves behind. Run it before and
// after a browser check: a Vite server started for a smoke test otherwise
// survives its own cleanup (see AGENTS.md, "Dev servers leave no survivors").
//
// Why a script and not `pkill -f vite`: Git Bash's pkill cannot signal
// Windows-native node.exe processes, so it exits 0 having killed nothing, while
// the server keeps running and silently serves the next check. This sweeps by
// command line instead — and never touches the agent's own process, which is
// node too.

import { execFileSync } from 'node:child_process'

const LIST = `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress`

function nodeProcesses() {
  const out = execFileSync('powershell', ['-NoProfile', '-Command', LIST], { encoding: 'utf8' })
  const parsed = JSON.parse(out.trim() === '' ? '[]' : out)
  return Array.isArray(parsed) ? parsed : [parsed]
}

/** This repo's servers: a vite here, or the npm/npx wrapper around one. */
function isFolioSpawn(commandLine = '') {
  return (
    commandLine.includes('folio') ||
    /npm-cli\.js"?\s+run\s+(dev|test|build)\b/.test(commandLine) ||
    /npx-cli\.js"?\s+vite/.test(commandLine)
  )
}

const targets = nodeProcesses().filter(
  (p) =>
    p.ProcessId !== process.pid &&
    p.ProcessId !== process.ppid && // the npm wrapper running this script
    !/pi-coding-agent/.test(p.CommandLine ?? '') &&
    isFolioSpawn(p.CommandLine),
)

if (targets.length === 0) {
  console.log('kill:dev — no Folio node processes running')
} else {
  for (const target of targets) {
    const command = (target.CommandLine ?? '').replace(/^.*node\.exe"?\s*/, '').slice(0, 72)
    try {
      process.kill(target.ProcessId)
      console.log(`kill:dev — killed ${target.ProcessId}  ${command}`)
    } catch (error) {
      console.log(`kill:dev — ${target.ProcessId} already gone (${error.code})`)
    }
  }
  console.log(`kill:dev — ${targets.length} Folio process(es) killed`)
}
