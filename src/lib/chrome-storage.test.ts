import { describe, expect, it, vi } from 'vitest'

import {
    importAllSettings,
    loadAllMappings,
    loadMappingsForHost,
    normalizeStore,
    onMappingsChanged,
    saveMappingsForHost,
    STORAGE_KEY,
} from './chrome-storage'

async function readArea(area: 'sync' | 'local'): Promise<unknown> {
    const result = await chrome.storage[area].get(STORAGE_KEY)
    return result[STORAGE_KEY]
}

describe('normalizeStore', () => {
    it('keeps the current mapping format and drops unset optional fields', () => {
        const store = normalizeStore({
            'example.com': {
                helvetica: {
                    name: 'Inter',
                    id: 'Inter-Regular',
                    scale: 1.1,
                    bold: true,
                    italic: true,
                    lineHeight: 1.5,
                    letterSpacing: 0.05,
                    wordSpacing: 0.1,
                    color: '#ff0000',
                },
                arial: { name: 'Roboto' },
            },
        })

        expect(store).toEqual({
            'example.com': {
                helvetica: {
                    name: 'Inter',
                    id: 'Inter-Regular',
                    scale: 1.1,
                    bold: true,
                    italic: true,
                    lineHeight: 1.5,
                    letterSpacing: 0.05,
                    wordSpacing: 0.1,
                    color: '#ff0000',
                },
                arial: { name: 'Roboto' },
            },
        })
    })

    it('upgrades legacy string and { font } mappings', () => {
        expect(normalizeStore({
            'example.com': {
                helvetica: 'Inter',
                arial: { font: 'Roboto' },
            },
        })).toEqual({
            'example.com': {
                helvetica: { name: 'Inter' },
                arial: { name: 'Roboto' },
            },
        })
    })

    it('drops invalid or default-valued optional fields', () => {
        const { host } = normalizeStore({
            host: {
                a: { name: 'A', scale: 1, id: '', bold: 'true', italic: 1 },
                b: { name: 'B', scale: 0 },
                c: { name: 'C', scale: -2 },
                d: { name: 'D', scale: Number.NaN },
                e: { name: 'E', lineHeight: 0.4, letterSpacing: 1.5, wordSpacing: -1 },
                f: { name: 'F', lineHeight: Number.POSITIVE_INFINITY },
                g: { name: 'G', color: 'red' },
                h: { name: 'H', color: '#12345' },
            },
        })

        for (const mapping of Object.values(host)) {
            expect(Object.entries(mapping).filter(([, v]) => v !== undefined)).toEqual([['name', mapping.name]])
        }
    })

    it('accepts boundary values for ranged fields and 3/6/8-digit hex colors', () => {
        const { host } = normalizeStore({
            host: {
                a: { name: 'A', lineHeight: 0.5, letterSpacing: -0.5, wordSpacing: 2, color: '#abc' },
                b: { name: 'B', lineHeight: 5, letterSpacing: 1, wordSpacing: -0.5, color: '#AABBCCDD' },
            },
        })

        expect(host.a).toMatchObject({ lineHeight: 0.5, letterSpacing: -0.5, wordSpacing: 2, color: '#abc' })
        expect(host.b).toMatchObject({ lineHeight: 5, letterSpacing: 1, wordSpacing: -0.5, color: '#AABBCCDD' })
    })

    it('skips junk mapping entries', () => {
        expect(normalizeStore({
            host: {
                empty: '',
                nullish: null,
                num: 42,
                noName: { scale: 2 },
                badName: { name: 7 },
                badFont: { font: null },
                ok: 'Inter',
            },
        })).toEqual({ host: { ok: { name: 'Inter' } } })
    })

    it('returns an empty store for non-object input', () => {
        expect(normalizeStore(undefined)).toEqual({})
        expect(normalizeStore(null)).toEqual({})
        expect(normalizeStore('nope')).toEqual({})
        expect(normalizeStore(42)).toEqual({})
    })

    it('keeps a host with junk mappings as an empty map', () => {
        expect(normalizeStore({ host: 'junk', other: null })).toEqual({ host: {}, other: {} })
    })
})

describe('mapping storage', () => {
    it('round-trips mappings for a host through chrome.storage.sync', async () => {
        await saveMappingsForHost('example.com', {
            helvetica: { name: 'Inter', scale: 1.2, color: '#123456' },
        })

        expect(await loadMappingsForHost('example.com')).toEqual({
            helvetica: { name: 'Inter', scale: 1.2, color: '#123456' },
        })
        expect(await loadMappingsForHost('other.com')).toEqual({})
        expect(await readArea('sync')).toEqual({
            'example.com': { helvetica: { name: 'Inter', scale: 1.2, color: '#123456' } },
        })
    })

    it('removes a host when saving an empty map', async () => {
        await saveMappingsForHost('a.com', { x: { name: 'X' } })
        await saveMappingsForHost('b.com', { y: { name: 'Y' } })
        await saveMappingsForHost('a.com', {})

        expect(await loadAllMappings()).toEqual({ 'b.com': { y: { name: 'Y' } } })
    })

    it('falls back to legacy local data and normalizes it', async () => {
        await chrome.storage.local.set({ [STORAGE_KEY]: { 'example.com': { helvetica: 'Inter' } } })

        expect(await loadAllMappings()).toEqual({ 'example.com': { helvetica: { name: 'Inter' } } })
    })

    it('prefers sync over local and clears local after a sync write', async () => {
        await chrome.storage.local.set({ [STORAGE_KEY]: { 'stale.com': { a: 'A' } } })
        await chrome.storage.sync.set({ [STORAGE_KEY]: { 'fresh.com': { b: 'B' } } })

        expect(await loadAllMappings()).toEqual({ 'fresh.com': { b: { name: 'B' } } })

        await saveMappingsForHost('fresh.com', { c: { name: 'C' } })
        expect(await readArea('local')).toBeUndefined()
    })

    it('writes to local when the sync write fails', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(chrome.storage.sync, 'set').mockImplementationOnce(() => Promise.reject(new Error('QUOTA_BYTES')))

        await saveMappingsForHost('example.com', { a: { name: 'A' } })

        expect(warn).toHaveBeenCalledOnce()
        expect(await readArea('sync')).toBeUndefined()
        expect(await readArea('local')).toEqual({ 'example.com': { a: { name: 'A' } } })
        vi.restoreAllMocks()
    })
})

describe('importAllSettings', () => {
    it('replaces existing settings with an export payload', async () => {
        await saveMappingsForHost('old.com', { a: { name: 'A' } })

        const result = await importAllSettings(JSON.stringify({
            version: 1,
            mappings: { 'new.com': { b: { name: 'B' }, c: 'C' } },
        }))

        expect(result).toEqual({ hostCount: 1, mappingCount: 2 })
        expect(await loadAllMappings()).toEqual({ 'new.com': { b: { name: 'B' }, c: { name: 'C' } } })
    })

    it('merges per host, with imported mappings winning', async () => {
        await saveMappingsForHost('a.com', { x: { name: 'Old' }, y: { name: 'Y' } })

        const result = await importAllSettings(
            JSON.stringify({ 'a.com': { x: { name: 'New' } }, 'b.com': { z: { name: 'Z' } } }),
            'merge',
        )

        expect(result).toEqual({ hostCount: 2, mappingCount: 3 })
        expect(await loadAllMappings()).toEqual({
            'a.com': { x: { name: 'New' }, y: { name: 'Y' } },
            'b.com': { z: { name: 'Z' } },
        })
    })

    it('rejects malformed input', async () => {
        await expect(importAllSettings('not json')).rejects.toThrow(SyntaxError)
        await expect(importAllSettings('null')).rejects.toThrow('Invalid JSON')
        await expect(importAllSettings('{}')).rejects.toThrow('No valid mappings')
    })
})

describe('onMappingsChanged', () => {
    it('coalesces changes in the same tick into one callback', async () => {
        const callback = vi.fn()
        const unsubscribe = onMappingsChanged(callback)

        await Promise.all([
            chrome.storage.sync.set({ [STORAGE_KEY]: { 'a.com': { x: 'X' } } }),
            chrome.storage.local.set({ [STORAGE_KEY]: { 'b.com': { y: 'Y' } } }),
            chrome.storage.sync.set({ unrelated: 1 }),
        ])

        await vi.waitFor(() => expect(callback).toHaveBeenCalledOnce())
        expect(callback).toHaveBeenCalledWith({ 'a.com': { x: { name: 'X' } } })

        unsubscribe()
        await chrome.storage.sync.set({ [STORAGE_KEY]: {} })
        await new Promise(resolve => setTimeout(resolve, 0))
        expect(callback).toHaveBeenCalledOnce()
    })
})
