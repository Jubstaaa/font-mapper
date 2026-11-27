import { defineManifest } from '@crxjs/vite-plugin'

import pkg from './package.json' with { type: 'json' }

const WEB_PAGES = ['http://*/*', 'https://*/*']

const icons = {
    '16': 'icon-16.png',
    '32': 'icon-32.png',
    '48': 'icon-48.png',
    '128': 'icon-128.png',
}

export default defineManifest({
    action: {
        default_icon: icons,
        default_popup: 'index.html',
        default_title: 'FontMapper',
    },
    background: {
        service_worker: 'src/background/background.ts',
        type: 'module',
    },
    content_scripts: [
        {
            all_frames: false,
            js: ['src/content/content.ts'],
            matches: WEB_PAGES,
            run_at: 'document_start',
        },
    ],
    description:
        'Replace any website’s fonts with the fonts installed on your computer — per domain.',
    host_permissions: WEB_PAGES,
    icons,
    manifest_version: 3,
    minimum_chrome_version: '103',
    name: 'FontMapper – Local Fonts for Any Website',
    options_page: 'options.html',
    permissions: ['activeTab', 'storage'],
    version: pkg.version,
})
