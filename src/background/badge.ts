import {
    FONT_CACHE_KEY,
    STORAGE_KEY,
    loadAllMappings,
    loadCachedLocalFonts,
    type CachedLocalFont,
    type FontMapping,
} from '@/lib/chrome-storage'

const BADGE_COLOR = '#242424'

function isHttpUrl(url: string | undefined): url is string {
    return typeof url === 'string' && /^https?:/.test(url)
}

function hostnameOf(url: string): string | null {
    try {
        return new URL(url).hostname
    } catch {
        return null
    }
}

function isMappingInstalledLocally(mapping: FontMapping, fonts: CachedLocalFont[]): boolean {
    if (!fonts.length) return false
    return fonts.some(f =>
        f.family === mapping.name
        || (mapping.id !== undefined && f.postscriptName === mapping.id)
        || f.fullName === mapping.name,
    )
}

async function updateBadgeForTab(tabId: number, url: string | undefined): Promise<void> {
    if (!isHttpUrl(url)) {
        await chrome.action.setBadgeText({ tabId, text: '' })
        return
    }
    const hostname = hostnameOf(url)
    if (!hostname) {
        await chrome.action.setBadgeText({ tabId, text: '' })
        return
    }
    const [all, fonts] = await Promise.all([loadAllMappings(), loadCachedLocalFonts()])
    const mappings = all[hostname] ?? {}
    const count = Object.values(mappings).filter(m => isMappingInstalledLocally(m, fonts)).length
    await chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR })
    await chrome.action.setBadgeText({ tabId, text: count > 0 ? String(count) : '' })
}

export async function refreshAllBadges(): Promise<void> {
    const tabs = await chrome.tabs.query({})
    await Promise.all(
        tabs.map(t => (t.id != null ? updateBadgeForTab(t.id, t.url).catch(() => {}) : Promise.resolve())),
    )
}

export function registerBadgeListeners(): void {
    chrome.tabs.onActivated.addListener(({ tabId }) => {
        chrome.tabs.get(tabId).then(tab => updateBadgeForTab(tabId, tab.url)).catch(() => {})
    })

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.url || changeInfo.status === 'loading' || changeInfo.status === 'complete') {
            void updateBadgeForTab(tabId, tab.url)
        }
    })

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync' && area !== 'local') return
        if (!(STORAGE_KEY in changes) && !(FONT_CACHE_KEY in changes)) return
        void refreshAllBadges()
    })
}
