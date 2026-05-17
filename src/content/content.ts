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
const activeFontFaces = new Map<string, FontFace[]>()

function escapeSingleQuoted(name: string): string {
    return name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function escapeDoubleQuoted(name: string): string {
    return name.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function resolveLocalName(mapping: { name: string; id?: string }): string {
    return mapping.id || mapping.name
}

function buildCss(mappings: FontMap): string {
    const rules: string[] = []
    for (const [source, mapping] of Object.entries(mappings)) {
        if (!mapping?.name) continue
        const s = escapeSingleQuoted(source)
        const t = escapeSingleQuoted(resolveLocalName(mapping))
        rules.push(
            `@font-face { font-family: '${s}'; src: local('${t}'); font-style: normal; font-weight: 100 1000; font-display: swap; }`,
            `@font-face { font-family: '${s}'; src: local('${t}'); font-style: italic; font-weight: 100 1000; font-display: swap; }`,
        )
    }
    return rules.join('\n')
}

function clearFontFaces(): void {
    for (const [, faces] of activeFontFaces) {
        for (const face of faces) {
            try {
                document.fonts.delete(face)
            } catch {}
        }
    }
    activeFontFaces.clear()
}

async function applyFontFaces(mappings: FontMap): Promise<void> {
    clearFontFaces()
    for (const [source, mapping] of Object.entries(mappings)) {
        if (!mapping?.name) continue
        const src = `local("${escapeDoubleQuoted(resolveLocalName(mapping))}")`
        const faces: FontFace[] = []
        for (const style of ['normal', 'italic'] as const) {
            const ff = new FontFace(source, src, {
                style,
                weight: '100 1000',
                display: 'swap',
            })
            try {
                const loaded = await ff.load()
                document.fonts.add(loaded)
                faces.push(loaded)
            } catch {}
        }
        if (faces.length) activeFontFaces.set(source, faces)
    }
}

function getStyleTarget(): Element {
    return document.head || document.documentElement || document.body
}

function ensureLastChild(): void {
    const el = document.getElementById(STYLE_ID)
    if (!el) return
    const target = getStyleTarget()
    if (!target) return
    if (target.lastElementChild !== el) {
        target.appendChild(el)
    }
}

function applyStyle(css: string): void {
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (!el) {
        el = document.createElement('style')
        el.id = STYLE_ID
    }
    el.textContent = css
    const target = getStyleTarget()
    if (target) target.appendChild(el)
}

const styleObserver = new MutationObserver(records => {
    for (const record of records) {
        for (const node of record.addedNodes) {
            if (!(node instanceof HTMLElement)) continue
            if (node.id === STYLE_ID) continue
            if (node.tagName === 'STYLE' || node.tagName === 'LINK') {
                ensureLastChild()
                return
            }
        }
    }
})

function startObservers(): void {
    const root = document.documentElement
    if (root) styleObserver.observe(root, { childList: true, subtree: true })
}

function ensureHighlightStyle(): void {
    if (document.getElementById(HIGHLIGHT_STYLE_ID)) return
    const el = document.createElement('style')
    el.id = HIGHLIGHT_STYLE_ID
    el.textContent = `
        .${HIGHLIGHT_CLASS} {
            background-color: rgba(37, 99, 235, 0.12) !important;
            transition: background-color 80ms ease !important;
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

function apply(mappings: FontMap): void {
    applyStyle(buildCss(mappings))
    void applyFontFaces(mappings)
}

async function init(): Promise<void> {
    try {
        const mappings = await loadMappingsForHost(location.hostname)
        apply(mappings)
    } catch {}
}

startObservers()
void init()

document.addEventListener('DOMContentLoaded', ensureLastChild)
window.addEventListener('load', ensureLastChild)

onMappingsChanged(store => {
    apply(store[location.hostname] || {})
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
