import type {
    CachedLocalFont,
    ExportPayload,
    FontMap,
    FontMapping,
    FontMapStore,
} from './chrome-storage.types'

export type { CachedLocalFont, ExportPayload, FontMap, FontMapping, FontMapStore } from './chrome-storage.types'

export const STORAGE_KEY = 'fontMapperMappings'
export const FONT_CACHE_KEY = 'fontMapperLocalFonts'
export const FONT_CACHE_VERSION_KEY = 'fontMapperLocalFontsVersion'
export const FONT_CACHE_VERSION = 2

export async function loadCachedLocalFonts(): Promise<CachedLocalFont[]> {
    const result = await chrome.storage.local.get(FONT_CACHE_KEY)
    const raw = result[FONT_CACHE_KEY]
    return Array.isArray(raw) ? (raw as CachedLocalFont[]) : []
}

export async function loadCachedLocalFontsVersion(): Promise<number> {
    const result = await chrome.storage.local.get(FONT_CACHE_VERSION_KEY)
    const v = result[FONT_CACHE_VERSION_KEY]
    return typeof v === 'number' ? v : 0
}

export async function saveCachedLocalFonts(fonts: CachedLocalFont[]): Promise<void> {
    await chrome.storage.local.set({
        [FONT_CACHE_KEY]: fonts,
        [FONT_CACHE_VERSION_KEY]: FONT_CACHE_VERSION,
    })
}

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

function normalizeOptionalNumber(value: unknown, min: number, max: number): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
    if (value < min || value > max) return undefined
    return value
}

function normalizeOptionalColor(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined
    return HEX_COLOR_RE.test(value) ? value : undefined
}

function normalizeMappings(raw: unknown): FontMap {
    if (!raw || typeof raw !== 'object') return {}
    const out: FontMap = {}
    for (const [source, value] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof value === 'string' && value) {
            out[source] = { name: value }
        } else if (
            value
            && typeof value === 'object'
            && 'name' in value
            && typeof (value as FontMapping).name === 'string'
        ) {
            const v = value as FontMapping
            const scale = typeof v.scale === 'number' && Number.isFinite(v.scale) && v.scale > 0 && v.scale !== 1
                ? v.scale
                : undefined
            const bold = v.bold === true ? true : undefined
            const italic = v.italic === true ? true : undefined
            out[source] = {
                name: v.name,
                id: typeof v.id === 'string' && v.id ? v.id : undefined,
                scale,
                bold,
                italic,
                lineHeight: normalizeOptionalNumber(v.lineHeight, 0.5, 5),
                letterSpacing: normalizeOptionalNumber(v.letterSpacing, -0.5, 1),
                wordSpacing: normalizeOptionalNumber(v.wordSpacing, -0.5, 2),
                color: normalizeOptionalColor(v.color),
            }
        } else if (
            value
            && typeof value === 'object'
            && 'font' in value
            && typeof (value as { font: unknown }).font === 'string'
        ) {
            out[source] = { name: (value as { font: string }).font }
        }
    }
    return out
}

export function normalizeStore(raw: unknown): FontMapStore {
    if (!raw || typeof raw !== 'object') return {}
    const out: FontMapStore = {}
    for (const [host, value] of Object.entries(raw as Record<string, unknown>)) {
        out[host] = normalizeMappings(value)
    }
    return out
}

async function readRawMappings(): Promise<unknown> {
    const sync = await chrome.storage.sync.get(STORAGE_KEY)
    if (sync[STORAGE_KEY] !== undefined) return sync[STORAGE_KEY]
    const local = await chrome.storage.local.get(STORAGE_KEY)
    return local[STORAGE_KEY]
}

async function writeRawMappings(store: FontMapStore): Promise<void> {
    try {
        await chrome.storage.sync.set({ [STORAGE_KEY]: store })
        await chrome.storage.local.remove(STORAGE_KEY).catch(() => {})
    } catch (err) {
        console.warn('FontMapper: sync write failed, falling back to local', err)
        await chrome.storage.local.set({ [STORAGE_KEY]: store })
    }
}

export async function loadAllMappings(): Promise<FontMapStore> {
    return normalizeStore(await readRawMappings())
}

export async function loadMappingsForHost(hostname: string): Promise<FontMap> {
    const all = await loadAllMappings()
    return all[hostname] || {}
}

export async function saveMappingsForHost(hostname: string, mappings: FontMap): Promise<void> {
    const all = await loadAllMappings()
    if (Object.keys(mappings).length === 0) {
        delete all[hostname]
    } else {
        all[hostname] = mappings
    }
    await writeRawMappings(all)
}

export async function exportAllSettings(): Promise<ExportPayload> {
    const mappings = await loadAllMappings()
    return {
        version: 1,
        exportedAt: new Date().toISOString(),
        mappings,
    }
}

export async function importAllSettings(
    json: string,
    mode: 'merge' | 'replace' = 'replace',
): Promise<{ hostCount: number; mappingCount: number }> {
    const parsed: unknown = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON: expected an object')
    }
    const root = parsed as Record<string, unknown>
    const raw = 'mappings' in root ? root.mappings : root
    const normalized = normalizeStore(raw)
    if (!Object.keys(normalized).length) {
        throw new Error('No valid mappings found in the file')
    }

    let next: FontMapStore
    if (mode === 'merge') {
        const existing = await loadAllMappings()
        next = { ...existing }
        for (const [host, mappings] of Object.entries(normalized)) {
            next[host] = { ...(next[host] ?? {}), ...mappings }
        }
    } else {
        next = normalized
    }

    await writeRawMappings(next)

    const hostCount = Object.keys(next).length
    const mappingCount = Object.values(next).reduce((sum, m) => sum + Object.keys(m).length, 0)
    return { hostCount, mappingCount }
}

export async function clearAllSettings(): Promise<void> {
    await Promise.allSettled([
        chrome.storage.sync.remove(STORAGE_KEY),
        chrome.storage.local.remove(STORAGE_KEY),
    ])
}

export function onMappingsChanged(callback: (store: FontMapStore) => void): () => void {
    let pending = false
    const listener = (
        changes: Record<string, chrome.storage.StorageChange>,
        area: chrome.storage.AreaName,
    ) => {
        if ((area !== 'sync' && area !== 'local') || !changes[STORAGE_KEY]) return
        if (pending) return
        pending = true
        queueMicrotask(() => {
            pending = false
            loadAllMappings().then(callback).catch(() => {})
        })
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
}

export { migrateMappingsToSync } from './chrome-storage-migration'
