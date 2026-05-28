import {
    FONT_CACHE_KEY,
    loadCachedLocalFonts,
    loadMappingsForHost,
    onMappingsChanged,
    type CachedLocalFont,
    type FontMap,
} from '@/lib/chrome-storage'
import {
    POPUP_PORT_NAME,
    type ApplyMappingsMessage,
    type ApplyMappingsResponse,
    type ExtensionMessage,
    type GetUsedFontsMessage,
    type GetUsedFontsResponse,
    type PortMessage,
} from '@/lib/chrome-messaging'

import { hasMappings, rebuildLookup, setCachedFonts, walkAll } from './element-override'
import { clearHighlight, highlightFont } from './highlight'
import { onResize, scheduleWalk, startObservers } from './observers'
import { collectUsedFonts } from './used-fonts'

function apply(mappings: FontMap): void {
    rebuildLookup(mappings)
    walkAll()
}

async function loadFontCache(): Promise<void> {
    try {
        const fonts = await loadCachedLocalFonts()
        setCachedFonts(fonts)
    } catch {
        setCachedFonts([])
    }
}

async function init(): Promise<void> {
    try {
        await loadFontCache()
        const mappings = await loadMappingsForHost(location.hostname)
        rebuildLookup(mappings)
        if (document.body) {
            walkAll()
        } else {
            scheduleWalk()
        }
    } catch {}
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
    apply(store[location.hostname] || {})
})

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[FONT_CACHE_KEY]) return
    const next = changes[FONT_CACHE_KEY].newValue
    setCachedFonts(Array.isArray(next) ? (next as CachedLocalFont[]) : [])
    void loadMappingsForHost(location.hostname).then(apply).catch(() => {})
})

chrome.runtime.onMessage.addListener(
    (
        msg: ExtensionMessage,
        _sender,
        sendResponse: (response?: GetUsedFontsResponse | ApplyMappingsResponse) => void,
    ) => {
        if ((msg as GetUsedFontsMessage)?.type === 'GET_USED_FONTS') {
            sendResponse({ fonts: collectUsedFonts(), hostname: location.hostname })
            return false
        }
        if ((msg as ApplyMappingsMessage)?.type === 'APPLY_MAPPINGS') {
            apply((msg as ApplyMappingsMessage).mappings || {})
            sendResponse({ ok: true })
            return false
        }
        return false
    },
)

chrome.runtime.onConnect.addListener(port => {
    if (port.name !== POPUP_PORT_NAME) return
    port.onMessage.addListener((msg: PortMessage) => {
        if (msg?.type === 'HIGHLIGHT_FONT') {
            highlightFont(msg.font)
        } else if (msg?.type === 'CLEAR_HIGHLIGHT') {
            clearHighlight()
        }
    })
    port.onDisconnect.addListener(() => {
        clearHighlight()
    })
})
