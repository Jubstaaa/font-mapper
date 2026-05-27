import {
    FONT_CACHE_KEY,
    loadCachedLocalFonts,
    loadMappingsForHost,
    onMappingsChanged,
    type CachedLocalFont,
    type FontMap,
    type FontMapping,
} from '@/lib/chrome-storage'
import { getFamilyVariants } from '@/lib/chrome-fonts'
import {
    POPUP_PORT_NAME,
    type ApplyMappingsMessage,
    type ApplyMappingsResponse,
    type ExtensionMessage,
    type GetUsedFontsMessage,
    type GetUsedFontsResponse,
    type PortMessage,
} from '@/lib/chrome-messaging'

const HIGHLIGHT_STYLE_ID = '__font_mapper_highlight_style__'
const HIGHLIGHT_CLASS = '__font_mapper_highlight__'
const MAPPED_ATTR = 'data-fm-mapped'

const GENERIC_KEYWORDS = new Set([
    'sans-serif',
    'serif',
    'monospace',
    'cursive',
    'fantasy',
    'math',
    'system-ui',
    'ui-sans-serif',
    'ui-serif',
    'ui-monospace',
    'ui-rounded',
    'emoji',
    'fangsong',
    '-apple-system',
    'blinkmacsystemfont',
])

const SKIP_KEYWORDS = new Set(['inherit', 'initial', 'unset', 'revert', 'revert-layer'])

interface InlineSnapshot {
    value: string
    priority: string
}

interface OverrideState {
    sourceKey: string
    targetSignature: string
    inlineFontFamily: InlineSnapshot
    inlineFontSize: InlineSnapshot
    inlineLineHeight: InlineSnapshot
    inlineLetterSpacing: InlineSnapshot
    inlineWordSpacing: InlineSnapshot
    inlineColor: InlineSnapshot
    originalComputedSizePx: number
    originalChain: string[]
}

function snapshotInline(el: HTMLElement, prop: string): InlineSnapshot {
    return {
        value: el.style.getPropertyValue(prop),
        priority: el.style.getPropertyPriority(prop),
    }
}

function restoreInline(el: HTMLElement, prop: string, snap: InlineSnapshot): void {
    if (snap.value) {
        el.style.setProperty(prop, snap.value, snap.priority)
    } else {
        el.style.removeProperty(prop)
    }
}

const overrides = new WeakMap<HTMLElement, OverrideState>()
const fontElementCache = new Map<string, WeakRef<Element>[]>()

let cachedFonts: CachedLocalFont[] = []
let lookup = new Map<string, FontMapping>()

function rebuildLookup(mappings: FontMap): void {
    lookup = new Map()
    for (const [k, v] of Object.entries(mappings)) {
        if (v?.name) lookup.set(k.toLowerCase(), v)
    }
}

function isMappingApplicable(mapping: FontMapping): boolean {
    if (!cachedFonts.length) return false
    const family = mapping.name
    const psName = mapping.id
    return cachedFonts.some(f =>
        f.family === family
        || (psName ? f.postscriptName === psName : false)
        || f.fullName === family,
    )
}

function resolveLocalName(mapping: FontMapping): string {
    if (cachedFonts.length && (mapping.bold || mapping.italic)) {
        const variants = getFamilyVariants(mapping.name, cachedFonts)
        const target =
            (mapping.bold && mapping.italic && variants.boldItalic)
            || (mapping.bold && variants.bold)
            || (mapping.italic && variants.italic)
            || variants.regular
        if (target) return target.postscriptName
    }
    return mapping.id || mapping.name
}

function parseFontFamilyChain(value: string): string[] {
    const parts: string[] = []
    let buf = ''
    let quote: string | null = null
    for (let i = 0; i < value.length; i++) {
        const ch = value[i]
        if (quote) {
            if (ch === '\\' && i + 1 < value.length) {
                buf += value[i + 1]
                i++
            } else if (ch === quote) {
                quote = null
            } else {
                buf += ch
            }
        } else if (ch === '"' || ch === "'") {
            quote = ch
        } else if (ch === ',') {
            const t = buf.trim()
            if (t) parts.push(t)
            buf = ''
        } else {
            buf += ch
        }
    }
    const tail = buf.trim()
    if (tail) parts.push(tail)
    return parts
}

function quoteFamily(name: string): string {
    if (/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name) && !GENERIC_KEYWORDS.has(name.toLowerCase())) {
        return name
    }
    return `"${name.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function matchChain(chain: string[]): { sourceKey: string; mapping: FontMapping } | null {
    for (const font of chain) {
        const key = font.toLowerCase()
        if (SKIP_KEYWORDS.has(key)) continue
        const mapping = lookup.get(key)
        if (mapping) return { sourceKey: key, mapping }
    }
    return null
}

function targetSignatureFor(mapping: FontMapping): string {
    return [
        resolveLocalName(mapping),
        mapping.scale ?? 1,
        mapping.bold ? 1 : 0,
        mapping.italic ? 1 : 0,
        mapping.lineHeight ?? '_',
        mapping.letterSpacing ?? '_',
        mapping.wordSpacing ?? '_',
        mapping.color ?? '_',
    ].join('|')
}

function restoreElement(el: HTMLElement): void {
    const state = overrides.get(el)
    if (!state) return
    restoreInline(el, 'font-family', state.inlineFontFamily)
    restoreInline(el, 'font-size', state.inlineFontSize)
    restoreInline(el, 'line-height', state.inlineLineHeight)
    restoreInline(el, 'letter-spacing', state.inlineLetterSpacing)
    restoreInline(el, 'word-spacing', state.inlineWordSpacing)
    restoreInline(el, 'color', state.inlineColor)
    el.removeAttribute(MAPPED_ATTR)
    overrides.delete(el)
}

function applyToElement(el: HTMLElement): void {
    const existing = overrides.get(el)

    if (existing) {
        const stillMapped = lookup.get(existing.sourceKey)
        if (stillMapped && targetSignatureFor(stillMapped) === existing.targetSignature) {
            return
        }
        restoreElement(el)
    }

    const cs = window.getComputedStyle(el)
    const family = cs.fontFamily
    if (!family) return

    const chain = parseFontFamilyChain(family)
    const match = matchChain(chain)
    if (!match) return
    if (!isMappingApplicable(match.mapping)) return

    const parsedSize = parseFloat(cs.fontSize)
    const originalSizePx = Number.isFinite(parsedSize) ? parsedSize : 16

    const snapshots = {
        inlineFontFamily: snapshotInline(el, 'font-family'),
        inlineFontSize: snapshotInline(el, 'font-size'),
        inlineLineHeight: snapshotInline(el, 'line-height'),
        inlineLetterSpacing: snapshotInline(el, 'letter-spacing'),
        inlineWordSpacing: snapshotInline(el, 'word-spacing'),
        inlineColor: snapshotInline(el, 'color'),
    }

    const targetFamily = quoteFamily(resolveLocalName(match.mapping))
    el.style.setProperty('font-family', targetFamily, 'important')

    const m = match.mapping
    if (typeof m.scale === 'number' && Number.isFinite(m.scale) && m.scale > 0 && m.scale !== 1) {
        el.style.setProperty('font-size', `${(originalSizePx * m.scale).toFixed(3)}px`, 'important')
    }
    if (typeof m.lineHeight === 'number' && Number.isFinite(m.lineHeight) && m.lineHeight > 0) {
        el.style.setProperty('line-height', String(m.lineHeight), 'important')
    }
    if (typeof m.letterSpacing === 'number' && Number.isFinite(m.letterSpacing)) {
        el.style.setProperty('letter-spacing', `${m.letterSpacing}em`, 'important')
    }
    if (typeof m.wordSpacing === 'number' && Number.isFinite(m.wordSpacing)) {
        el.style.setProperty('word-spacing', `${m.wordSpacing}em`, 'important')
    }
    if (typeof m.color === 'string' && m.color) {
        el.style.setProperty('color', m.color, 'important')
    }

    el.setAttribute(MAPPED_ATTR, match.sourceKey)
    overrides.set(el, {
        sourceKey: match.sourceKey,
        targetSignature: targetSignatureFor(m),
        ...snapshots,
        originalComputedSizePx: originalSizePx,
        originalChain: chain,
    })
}

function walkAll(): void {
    if (!document.body) return
    if (lookup.size === 0) {
        clearAllOverrides()
        return
    }
    const nodes = document.body.querySelectorAll<HTMLElement>('*')
    applyToElement(document.body)
    for (const node of nodes) applyToElement(node)
}

function clearAllOverrides(): void {
    const els = document.querySelectorAll<HTMLElement>(`[${MAPPED_ATTR}]`)
    for (const el of els) restoreElement(el)
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

function pickPickerName(value: string): string | null {
    const trimmed = value.trim().replace(/^["']|["']$/g, '')
    if (!trimmed) return null
    if (SKIP_KEYWORDS.has(trimmed.toLowerCase())) return null
    return trimmed
}

function indexCache(name: string, node: Element): void {
    let list = fontElementCache.get(name)
    if (!list) {
        list = []
        fontElementCache.set(name, list)
    }
    list.push(new WeakRef(node))
}

const chainCache = new Map<Element, string[]>()

function chainForElement(node: Element): string[] {
    const cached = chainCache.get(node)
    if (cached) return cached
    const result = computeChainForElement(node)
    chainCache.set(node, result)
    return result
}

function computeChainForElement(node: Element): string[] {
    const state = node instanceof HTMLElement ? overrides.get(node) : undefined
    if (state) return state.originalChain
    const family = window.getComputedStyle(node).fontFamily
    if (!family) return []
    const parent = node.parentElement
    if (parent) {
        const parentFamily = window.getComputedStyle(parent).fontFamily
        if (parentFamily === family) {
            return chainForElement(parent)
        }
    }
    return parseFontFamilyChain(family)
}

function collectUsedFonts(): string[] {
    chainCache.clear()
    fontElementCache.clear()
    const found = new Set<string>()
    if (!document.body) return []
    const nodes = document.body.querySelectorAll('*')
    const allNodes: Element[] = [document.body, ...Array.from(nodes)]
    for (const node of allNodes) {
        const chain = chainForElement(node)
        if (!chain.length) continue

        let namedAdded = false
        for (const entry of chain) {
            const cleaned = pickPickerName(entry)
            if (!cleaned) continue
            const k = cleaned.toLowerCase()
            if (GENERIC_KEYWORDS.has(k)) continue
            found.add(cleaned)
            indexCache(cleaned, node)
            namedAdded = true
            break
        }

        if (namedAdded) continue

        for (let i = chain.length - 1; i >= 0; i--) {
            const cleaned = pickPickerName(chain[i])
            if (!cleaned) continue
            const k = cleaned.toLowerCase()
            if (!GENERIC_KEYWORDS.has(k)) continue
            found.add(cleaned)
            indexCache(cleaned, node)
            break
        }
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
    rebuildLookup(mappings)
    walkAll()
}

async function loadFontCache(): Promise<void> {
    try {
        cachedFonts = await loadCachedLocalFonts()
    } catch {
        cachedFonts = []
    }
}

let scheduledWalk = false
function scheduleWalk(): void {
    if (scheduledWalk) return
    scheduledWalk = true
    const run = () => {
        scheduledWalk = false
        walkAll()
    }
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback
    if (typeof ric === 'function') {
        ric(run, { timeout: 200 })
    } else {
        setTimeout(run, 0)
    }
}

const pendingNew = new Set<HTMLElement>()
let pendingFlushScheduled = false

function flushPending(): void {
    pendingFlushScheduled = false
    if (lookup.size === 0) {
        pendingNew.clear()
        return
    }
    for (const el of pendingNew) {
        if (!el.isConnected) continue
        applyToElement(el)
        const descendants = el.querySelectorAll<HTMLElement>('*')
        for (const child of descendants) applyToElement(child)
    }
    pendingNew.clear()
}

function schedulePendingFlush(): void {
    if (pendingFlushScheduled) return
    pendingFlushScheduled = true
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback
    if (typeof ric === 'function') {
        ric(flushPending, { timeout: 200 })
    } else {
        setTimeout(flushPending, 0)
    }
}

const domObserver = new MutationObserver(records => {
    if (lookup.size === 0) return
    for (const record of records) {
        for (const node of record.addedNodes) {
            if (node instanceof HTMLElement) {
                pendingNew.add(node)
            }
        }
    }
    if (pendingNew.size > 0) schedulePendingFlush()
})

function startObservers(): void {
    const root = document.documentElement
    if (root) domObserver.observe(root, { childList: true, subtree: true })
}

let resizeTimer: ReturnType<typeof setTimeout> | null = null
function onResize(): void {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
        resizeTimer = null
        if (lookup.size === 0) return
        clearAllOverrides()
        walkAll()
    }, 200)
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
    if (lookup.size > 0) walkAll()
})
window.addEventListener('load', () => {
    if (lookup.size > 0) walkAll()
})
window.addEventListener('resize', onResize, { passive: true })

onMappingsChanged(store => {
    apply(store[location.hostname] || {})
})

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[FONT_CACHE_KEY]) return
    const next = changes[FONT_CACHE_KEY].newValue
    cachedFonts = Array.isArray(next) ? (next as CachedLocalFont[]) : []
    loadMappingsForHost(location.hostname).then(mappings => apply(mappings)).catch(() => {})
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
