import { STORAGE_KEY, normalizeStore } from './chrome-storage'
import type { FontMapStore } from './chrome-storage.types'

export async function migrateMappingsToSync(): Promise<void> {
    const local = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY]
    if (!local || typeof local !== 'object') return
    const sync = (await chrome.storage.sync.get(STORAGE_KEY))[STORAGE_KEY]
    const merged: FontMapStore = normalizeStore({
        ...(local as Record<string, unknown>),
        ...((sync as Record<string, unknown>) ?? {}),
    })
    try {
        await chrome.storage.sync.set({ [STORAGE_KEY]: merged })
        await chrome.storage.local.remove(STORAGE_KEY)
    } catch (err) {
        console.warn('FontMapper: sync migration failed, keeping local copy', err)
    }
}
