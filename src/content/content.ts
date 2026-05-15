import { loadMappingsForHost, onMappingsChanged, type FontMap } from '@/lib/chrome-storage'
import type {
    ApplyMappingsMessage,
    ApplyMappingsResponse,
    ExtensionMessage,
    GetUsedFontsMessage,
    GetUsedFontsResponse,
} from '@/lib/chrome-messaging'

const STYLE_ID = '__font_mapper_style__'

function escapeFontName(name: string): string {
    return name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function buildCss(mappings: FontMap): string {
    const rules: string[] = []
    for (const [src, target] of Object.entries(mappings)) {
        if (!target) continue
        const s = escapeFontName(src)
        const t = escapeFontName(target)
        rules.push(
            `@font-face { font-family: '${s}'; src: local('${t}'); font-style: normal; font-weight: 100 1000; font-display: swap; }`,
            `@font-face { font-family: '${s}'; src: local('${t}'); font-style: italic; font-weight: 100 1000; font-display: swap; }`,
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

function collectUsedFonts(): string[] {
    const found = new Set<string>()
    const nodes = document.querySelectorAll('body, body *')
    for (const node of nodes) {
        if (!(node instanceof Element)) continue
        const family = window.getComputedStyle(node).fontFamily
        if (!family) continue
        const first = family.split(',')[0]?.trim().replace(/^["']|["']$/g, '')
        if (first && !first.startsWith('-') && first.toLowerCase() !== 'inherit') {
            found.add(first)
        }
    }
    return Array.from(found).sort((a, b) => a.localeCompare(b))
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
