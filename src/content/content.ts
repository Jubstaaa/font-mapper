import { loadMappingsForHost, onMappingsChanged, type FontMap } from '@/lib/chrome-storage'
import {
    POPUP_PORT_NAME,
    type ApplyMappingsMessage,
    type ApplyMappingsResponse,
    type ExtensionMessage,
    type GetUsedFontsMessage,
    type GetUsedFontsResponse,
    type PortMessage,
} from '@/lib/chrome-messaging'

const STYLE_ID = '__font_mapper_style__'
const HIGHLIGHT_STYLE_ID = '__font_mapper_highlight_style__'
const HIGHLIGHT_CLASS = '__font_mapper_highlight__'

const fontElementCache = new Map<string, WeakRef<Element>[]>()

function escapeFontName(name: string): string {
    return name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function buildCss(mappings: FontMap): string {
    const rules: string[] = []
    for (const [source, mapping] of Object.entries(mappings)) {
        if (!mapping?.font) continue
        const s = escapeFontName(source)
        const t = escapeFontName(mapping.font)
        const scale = typeof mapping.scale === 'number' && mapping.scale > 0 && mapping.scale !== 1
            ? ` size-adjust: ${(mapping.scale * 100).toFixed(2)}%;`
            : ''
        rules.push(
            `@font-face { font-family: '${s}'; src: local('${t}'); font-style: normal; font-weight: 100 1000; font-display: swap;${scale} }`,
            `@font-face { font-family: '${s}'; src: local('${t}'); font-style: italic; font-weight: 100 1000; font-display: swap;${scale} }`,
        )
    }
    return rules.join('\n')
}

function applyStyle(css: string): void {
    const root = document.documentElement || document
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (!el) {
        el = document.createElement('style')
        el.id = STYLE_ID
        root.appendChild(el)
    }
    el.textContent = css
}

function ensureHighlightStyle(): void {
    if (document.getElementById(HIGHLIGHT_STYLE_ID)) return
    const el = document.createElement('style')
    el.id = HIGHLIGHT_STYLE_ID
    el.textContent = `
        .${HIGHLIGHT_CLASS} {
            outline: 2px solid #2563eb !important;
            outline-offset: 1px !important;
            background-color: rgba(37, 99, 235, 0.08) !important;
            box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15) !important;
            transition: outline-color 80ms ease, background-color 80ms ease !important;
        }
    `
    ;(document.documentElement || document).appendChild(el)
}

function collectUsedFonts(): string[] {
    fontElementCache.clear()
    const found = new Set<string>()
    const nodes = document.querySelectorAll('body, body *')
    for (const node of nodes) {
        if (!(node instanceof Element)) continue
        const family = window.getComputedStyle(node).fontFamily
        if (!family) continue
        const first = family.split(',')[0]?.trim().replace(/^["']|["']$/g, '')
        if (!first || first.startsWith('-') || first.toLowerCase() === 'inherit') continue
        found.add(first)
        let list = fontElementCache.get(first)
        if (!list) {
            list = []
            fontElementCache.set(first, list)
        }
        list.push(new WeakRef(node))
    }
    return Array.from(found).sort((a, b) => a.localeCompare(b))
}

function highlightFont(fontName: string): void {
    ensureHighlightStyle()
    clearHighlight()
    const list = fontElementCache.get(fontName)
    if (!list) return
    for (const ref of list) {
        const el = ref.deref()
        if (el && el.isConnected) el.classList.add(HIGHLIGHT_CLASS)
    }
}

function clearHighlight(): void {
    document.querySelectorAll('.' + HIGHLIGHT_CLASS).forEach(el => el.classList.remove(HIGHLIGHT_CLASS))
}

async function init(): Promise<void> {
    try {
        const mappings = await loadMappingsForHost(location.hostname)
        applyStyle(buildCss(mappings))
    } catch {
        // ignore
    }
}

void init()

onMappingsChanged(store => {
    applyStyle(buildCss(store[location.hostname] || {}))
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
            applyStyle(buildCss((msg as ApplyMappingsMessage).mappings || {}))
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
