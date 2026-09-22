import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LogseqImportButton, LogseqImportPanel } from './LogseqImport'
import { emptyImportStats } from '../vault/logseqImport'

describe('LogseqImportButton', () => {
  it('reports the click', () => {
    const onClick = vi.fn()
    render(<LogseqImportButton onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Import from Logseq' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('LogseqImportPanel', () => {
  it('shows the phase and a progress bar while running', () => {
    render(
      <LogseqImportPanel
        view={{ kind: 'running', progress: { phase: 'writing', done: 3, total: 10 } }}
        onContinue={() => {}}
      />,
    )
    expect(screen.getByText('Writing the vault')).toBeTruthy()
    const bar = screen.getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('3')
    expect(bar.getAttribute('aria-valuemax')).toBe('10')
    expect(screen.getByText('3 of 10')).toBeTruthy()
  })

  it('shows the result summary and continues', () => {
    const onContinue = vi.fn()
    render(
      <LogseqImportPanel
        view={{
          kind: 'done',
          report: {
            written: 4,
            merged: 5,
            skipped: 2,
            assetsCopied: 3,
            alreadyImported: 6,
            collisions: [],
            stats: emptyImportStats(),
          },
        }}
        onContinue={onContinue}
      />,
    )
    expect(screen.getByText('Import complete')).toBeTruthy()
    expect(screen.getByText('4')).toBeTruthy()
    expect(screen.getByText('5')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('6')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it('reports a failure', () => {
    render(
      <LogseqImportPanel view={{ kind: 'error', message: 'disk full' }} onContinue={() => {}} />,
    )
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText('disk full')).toBeTruthy()
  })
})
