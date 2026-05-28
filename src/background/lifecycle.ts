import { migrateMappingsToSync } from '@/lib/chrome-storage'

import { refreshAllBadges } from './badge'

function openOptionsTab(): void {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') })
}

function runMigrationThenRefreshBadges(): void {
    void migrateMappingsToSync().then(refreshAllBadges).catch(() => {})
}

export function registerLifecycleListeners(): void {
    chrome.runtime.onInstalled.addListener(({ reason }) => {
        if (reason === 'install') openOptionsTab()
        runMigrationThenRefreshBadges()
    })

    chrome.runtime.onStartup.addListener(() => {
        runMigrationThenRefreshBadges()
    })
}
