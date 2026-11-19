import type { ManifestV3Export } from '@crxjs/vite-plugin'
import { describe, expect, it } from 'vitest'

import manifestExport from './manifest.config'

const WEB_PAGES = ['http://*/*', 'https://*/*']

async function resolveManifest(manifest: ManifestV3Export) {
    return typeof manifest === 'function' ? manifest({ command: 'build', mode: 'production' }) : manifest
}

describe('manifest', () => {
    it('only asks for http(s) pages, the only pages FontMapper can map', async () => {
        const manifest = await resolveManifest(manifestExport)

        expect(manifest.host_permissions).toEqual(WEB_PAGES)
        expect(manifest.content_scripts?.map(script => script.matches)).toEqual([WEB_PAGES])
    })
})
