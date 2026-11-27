import type { CachedLocalFont, FontMapStore } from '@/lib/chrome-storage.types'

import { isMappingInstalledLocally } from '@/lib/chrome-fonts'
import {
    FONT_CACHE_KEY,
    loadAllMappings,
    loadCachedLocalFonts,
    STORAGE_KEY,
} from '@/lib/chrome-storage'
import { httpHostname } from '@/lib/page-host'

const BADGE_COLOR = '#242424'

export async function refreshAllBadges(): Promise<void> {
    const [tabs, store, fonts] = await Promise.all([
        chrome.tabs.query({}),
        loadAllMappings(),
        loadCachedLocalFonts(),
    ])
    await Promise.all(
        tabs.flatMap(t =>
            t.id == null
                ? []
                : [
                      setBadge(t.id, badgeTextFor(t.url, store, fonts)).catch(
                          () => {}
                      ),
                  ]
        )
    )
}

export function registerBadgeListeners(): void {
    chrome.tabs.onActivated.addListener(({ tabId }) => {
        chrome.tabs
            .get(tabId)
            .then(tab => updateBadgeForTab(tabId, tab.url))
            .catch(() => {})
    })

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (
            changeInfo.url ||
            changeInfo.status === 'loading' ||
            changeInfo.status === 'complete'
        ) {
            void updateBadgeForTab(tabId, tab.url)
        }
    })

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync' && area !== 'local') return
        if (!(STORAGE_KEY in changes) && !(FONT_CACHE_KEY in changes)) return
        void refreshAllBadges()
    })
}

function badgeTextFor(
    url: string | undefined,
    store: FontMapStore,
    fonts: CachedLocalFont[]
): string {
    const hostname = httpHostname(url)
    if (!hostname) return ''
    const count = Object.values(store[hostname] ?? {}).filter(m =>
        isMappingInstalledLocally(m, fonts)
    ).length
    return count > 0 ? String(count) : ''
}

async function setBadge(tabId: number, text: string): Promise<void> {
    if (text)
        await chrome.action.setBadgeBackgroundColor({
            color: BADGE_COLOR,
            tabId,
        })
    await chrome.action.setBadgeText({ tabId, text })
}

async function updateBadgeForTab(
    tabId: number,
    url: string | undefined
): Promise<void> {
    const [store, fonts] = await Promise.all([
        loadAllMappings(),
        loadCachedLocalFonts(),
    ])
    await setBadge(tabId, badgeTextFor(url, store, fonts))
}
