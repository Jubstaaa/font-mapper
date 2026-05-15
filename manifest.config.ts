import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
    manifest_version: 3,
    name: 'FontMapper',
    version: '0.2.0',
    description: 'Map any website’s fonts to your local fonts — per domain.',
    permissions: ['activeTab', 'storage', 'fontSettings', 'scripting'],
    host_permissions: ['<all_urls>'],
    action: {
        default_popup: 'index.html',
        default_title: 'FontMapper',
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
