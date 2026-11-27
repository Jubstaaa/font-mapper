import { describe, expect, it, vi } from 'vitest'

import { FONT_CACHE_KEY, STORAGE_KEY } from '@/lib/chrome-storage'

import { refreshAllBadges } from './badge'

const inter = {
    family: 'Inter',
    fullName: 'Inter Regular',
    postscriptName: 'Inter-Regular',
    style: 'Regular',
}

async function seed(): Promise<number[]> {
    await chrome.storage.local.set({ [FONT_CACHE_KEY]: [inter] })
    await chrome.storage.sync.set({
        [STORAGE_KEY]: {
            'a.com': {
                arial: { name: 'Inter' },
                georgia: { name: 'Gone' },
                helvetica: { name: 'Inter' },
            },
        },
    })
    const urls = [
        'https://a.com/x',
        'https://b.com/',
        'chrome://settings',
        'https://a.com/y',
    ]
    const tabs = await Promise.all(urls.map(url => chrome.tabs.create({ url })))
    return tabs.flatMap(t => (t.id == null ? [] : [t.id]))
}

describe('refreshAllBadges', () => {
    it('shows the number of installed mappings for each tab host', async () => {
        const [a1, b, settings, a2] = await seed()

        await refreshAllBadges()

        expect(await chrome.action.getBadgeText({ tabId: a1 })).toBe('2')
        expect(await chrome.action.getBadgeText({ tabId: a2 })).toBe('2')
        expect(await chrome.action.getBadgeText({ tabId: b })).toBe('')
        expect(await chrome.action.getBadgeText({ tabId: settings })).toBe('')
    })

    it('reads storage once per refresh, not once per tab', async () => {
        await seed()
        const localGet = vi.spyOn(chrome.storage.local, 'get')
        const syncGet = vi.spyOn(chrome.storage.sync, 'get')

        await refreshAllBadges()

        expect(
            localGet.mock.calls.length + syncGet.mock.calls.length
        ).toBeLessThanOrEqual(3)
        vi.restoreAllMocks()
    })
})
