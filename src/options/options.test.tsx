import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { STORAGE_KEY } from '@/lib/chrome-storage'

import { Options } from './options'

afterEach(cleanup)

describe('Options — clear all mappings', () => {
    it('asks for confirmation in a dialog and clears only after confirming', async () => {
        await chrome.storage.sync.set({ [STORAGE_KEY]: { 'a.com': { x: { name: 'X' } } } })
        render(<Options />)

        fireEvent.click(screen.getByRole('button', { name: 'Clear all mappings' }))
        const dialog = await screen.findByRole('alertdialog')
        expect(dialog.textContent).toContain('cannot be undone')

        fireEvent.click(screen.getByRole('button', { name: 'Delete all' }))

        expect((await screen.findByRole('status')).textContent).toContain('All mappings cleared.')
        expect((await chrome.storage.sync.get(STORAGE_KEY))[STORAGE_KEY]).toBeUndefined()
    })

    it('keeps mappings when the dialog is cancelled', async () => {
        await chrome.storage.sync.set({ [STORAGE_KEY]: { 'a.com': { x: { name: 'X' } } } })
        render(<Options />)

        fireEvent.click(screen.getByRole('button', { name: 'Clear all mappings' }))
        fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

        expect(screen.queryByRole('alertdialog')).toBeNull()
        expect((await chrome.storage.sync.get(STORAGE_KEY))[STORAGE_KEY]).toBeDefined()
    })
})
