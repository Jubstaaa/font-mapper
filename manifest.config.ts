import { defineManifest } from '@crxjs/vite-plugin'

const icons = {
    '16': 'icon-16.png',
    '32': 'icon-32.png',
    '48': 'icon-48.png',
    '128': 'icon-128.png',
}

export default defineManifest({
    manifest_version: 3,
    name: 'FontMapper',
    version: '0.2.0',
    description: 'Map any website’s fonts to your local fonts — per domain.',
    permissions: ['activeTab', 'storage', 'fontSettings'],
    host_permissions: ['<all_urls>'],
    icons,
    action: {
        default_popup: 'index.html',
        default_title: 'FontMapper',
        default_icon: icons,
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
