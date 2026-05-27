import { defineManifest } from '@crxjs/vite-plugin'

const icons = {
    '16': 'icon-16.png',
    '32': 'icon-32.png',
    '48': 'icon-48.png',
    '128': 'icon-128.png',
}

export default defineManifest({
    manifest_version: 3,
    name: 'FontMapper – Local Fonts for Any Website',
    version: '0.9.0',
    description: 'Replace any website’s fonts with the fonts installed on your computer — per domain.',
    minimum_chrome_version: '103',
    permissions: ['activeTab', 'storage'],
    host_permissions: ['<all_urls>'],
    icons,
    action: {
        default_popup: 'index.html',
        default_title: 'FontMapper',
        default_icon: icons,
    },
    options_page: 'options.html',
    background: {
        service_worker: 'src/background/background.ts',
        type: 'module',
    },
    content_scripts: [
        {
            matches: ['<all_urls>'],
            js: ['src/content/content.ts'],
            run_at: 'document_start',
            all_frames: false,
        },
    ],
})
