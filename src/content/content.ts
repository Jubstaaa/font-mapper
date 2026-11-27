import type { CachedLocalFont, FontMap } from '@/lib/chrome-storage.types'

import {
    type ApplyMappingsResponse,
    type ExtensionMessage,
    type GetUsedFontsResponse,
    POPUP_PORT_NAME,
    type PortMessage,
} from '@/lib/chrome-messaging'
import {
    FONT_CACHE_KEY,
    loadCachedLocalFonts,
    loadMappingsForHost,
    onMappingsChanged,
} from '@/lib/chrome-storage'

import {
    hasMappings,
    rebuildLookup,
    setCachedFonts,
    walkAll,
} from './element-override'
import { clearHighlight, highlightFont } from './highlight'
import { onResize, scheduleWalk, startObservers } from './observers'
import { collectUsedFonts } from './used-fonts'

function apply(mappings: FontMap): void {
    rebuildLookup(mappings)
    walkAll()
}

async function init(): Promise<void> {
    try {
        await loadFontCache()
        const mappings = await loadMappingsForHost(location.hostname)
        rebuildLookup(mappings)
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- lib.dom types document.body as non-null, but a document_start content script runs before it exists
        if (document.body) {
            walkAll()
        } else {
            scheduleWalk()
        }
    } catch {}
}

async function loadFontCache(): Promise<void> {
    try {
        const fonts = await loadCachedLocalFonts()
        setCachedFonts(fonts)
    } catch {
        setCachedFonts([])
    }
}

startObservers()
void init()

document.addEventListener('DOMContentLoaded', () => {
    if (hasMappings()) walkAll()
})
window.addEventListener('load', () => {
    if (hasMappings()) walkAll()
})
window.addEventListener('resize', onResize, { passive: true })

onMappingsChanged(store => {
    apply(store[location.hostname] ?? {})
})

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[FONT_CACHE_KEY]) return
    const next = changes[FONT_CACHE_KEY].newValue
    setCachedFonts(Array.isArray(next) ? (next as CachedLocalFont[]) : [])
    void loadMappingsForHost(location.hostname)
        .then(apply)
        .catch(() => {})
})

chrome.runtime.onMessage.addListener(
    (
        msg: ExtensionMessage,
        _sender,
        sendResponse: (
            response?: ApplyMappingsResponse | GetUsedFontsResponse
        ) => void
    ) => {
        if (msg.type === 'GET_USED_FONTS') {
            sendResponse({
                fonts: collectUsedFonts(),
                hostname: location.hostname,
            })
            return false
        }
        if (msg.type === 'APPLY_MAPPINGS') {
            apply(msg.mappings)
            sendResponse({ ok: true })
            return false
        }
        return false
    }
)

chrome.runtime.onConnect.addListener(port => {
    if (port.name !== POPUP_PORT_NAME) return
    port.onMessage.addListener((msg: PortMessage) => {
        if (msg.type === 'HIGHLIGHT_FONT') {
            highlightFont(msg.font)
        } else {
            clearHighlight()
        }
    })
    port.onDisconnect.addListener(() => {
        clearHighlight()
    })
})
