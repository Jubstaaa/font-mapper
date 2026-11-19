import { describe, expect, it, vi } from 'vitest'

import { STORAGE_KEY } from './chrome-storage'
import { migrateMappingsToSync } from './chrome-storage-migration'

async function readArea(area: 'sync' | 'local'): Promise<unknown> {
    return (await chrome.storage[area].get(STORAGE_KEY))[STORAGE_KEY]
}

describe('migrateMappingsToSync', () => {
    it('moves legacy local mappings into sync and clears local', async () => {
        await chrome.storage.local.set({ [STORAGE_KEY]: { 'a.com': { x: 'X' } } })

        await migrateMappingsToSync()

        expect(await readArea('sync')).toEqual({ 'a.com': { x: { name: 'X' } } })
        expect(await readArea('local')).toBeUndefined()
    })

    it('lets the local copy win per host, since it is newer than what sync holds', async () => {
        await chrome.storage.sync.set({ [STORAGE_KEY]: { 'a.com': { x: 'Old' }, 'b.com': { y: 'Y' } } })
        await chrome.storage.local.set({ [STORAGE_KEY]: { 'a.com': { x: 'New' } } })

        await migrateMappingsToSync()

        expect(await readArea('sync')).toEqual({ 'a.com': { x: { name: 'New' } }, 'b.com': { y: { name: 'Y' } } })
    })

    it('keeps the local copy when the sync write fails', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(chrome.storage.sync, 'set').mockImplementationOnce(() => Promise.reject(new Error('QUOTA_BYTES')))
        await chrome.storage.local.set({ [STORAGE_KEY]: { 'a.com': { x: 'X' } } })

        await migrateMappingsToSync()

        expect(await readArea('local')).toEqual({ 'a.com': { x: 'X' } })
        vi.restoreAllMocks()
    })

    it('does nothing without a local copy', async () => {
        await chrome.storage.sync.set({ [STORAGE_KEY]: { 'a.com': { x: 'X' } } })

        await migrateMappingsToSync()

        expect(await readArea('sync')).toEqual({ 'a.com': { x: 'X' } })
    })
})
