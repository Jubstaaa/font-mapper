import { STORAGE_KEY, loadAllMappings } from '@/lib/chrome-storage'

const BADGE_COLOR = '#242424'

chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        chrome.tabs.create({ url: chrome.runtime.getURL('options.html?welcome=1') })
    }
})

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
    const all = await loadAllMappings()
    const count = Object.keys(all[hostname] ?? {}).length
    await chrome.action.setBadgeBackgroundColor({ tabId, color: BADGE_COLOR })
    await chrome.action.setBadgeText({ tabId, text: count > 0 ? String(count) : '' })
}

async function refreshAllBadges(): Promise<void> {
    const tabs = await chrome.tabs.query({})
    await Promise.all(
        tabs.map(t => (t.id != null ? updateBadgeForTab(t.id, t.url).catch(() => {}) : Promise.resolve())),
    )
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
    chrome.tabs.get(tabId).then(tab => updateBadgeForTab(tabId, tab.url)).catch(() => {})
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.status === 'loading' || changeInfo.status === 'complete') {
        void updateBadgeForTab(tabId, tab.url)
    }
})

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return
    if (!(STORAGE_KEY in changes)) return
    void refreshAllBadges()
})

chrome.runtime.onStartup.addListener(() => {
    void refreshAllBadges()
})

chrome.runtime.onInstalled.addListener(() => {
    void refreshAllBadges()
})
