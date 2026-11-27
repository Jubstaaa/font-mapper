import { migrateMappingsToSync } from '@/lib/chrome-storage-migration'

import { refreshAllBadges } from './badge'

export function registerLifecycleListeners(): void {
    chrome.runtime.onInstalled.addListener(({ reason }) => {
        if (reason === 'install') openOptionsTab()
        runMigrationThenRefreshBadges()
    })

    chrome.runtime.onStartup.addListener(() => {
        runMigrationThenRefreshBadges()
    })
}

function openOptionsTab(): void {
    void chrome.tabs.create({ url: chrome.runtime.getURL('options.html') })
}

function runMigrationThenRefreshBadges(): void {
    void migrateMappingsToSync()
        .then(refreshAllBadges)
        .catch(() => {})
}
