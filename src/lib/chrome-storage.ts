export const STORAGE_KEY = 'fontMapperMappings'
export const FONT_CACHE_KEY = 'fontMapperLocalFonts'

export interface CachedLocalFont {
    family: string
    fullName: string
    postscriptName: string
    style: string
}

export async function loadCachedLocalFonts(): Promise<CachedLocalFont[]> {
    const result = await chrome.storage.local.get(FONT_CACHE_KEY)
    const raw = result[FONT_CACHE_KEY]
    return Array.isArray(raw) ? (raw as CachedLocalFont[]) : []
}

export async function saveCachedLocalFonts(fonts: CachedLocalFont[]): Promise<void> {
    await chrome.storage.local.set({ [FONT_CACHE_KEY]: fonts })
}

export interface FontMapping {
    name: string
    id?: string
    scale?: number
    bold?: boolean
    italic?: boolean
}

export type FontMap = Record<string, FontMapping>
export type FontMapStore = Record<string, FontMap>

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

function normalizeStore(raw: unknown): FontMapStore {
    if (!raw || typeof raw !== 'object') return {}
    const out: FontMapStore = {}
    for (const [host, value] of Object.entries(raw as Record<string, unknown>)) {
        out[host] = normalizeMappings(value)
    }
    return out
}

export async function loadAllMappings(): Promise<FontMapStore> {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    return normalizeStore(result[STORAGE_KEY])
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
    await chrome.storage.local.set({ [STORAGE_KEY]: all })
}

export interface ExportPayload {
    version: 1
    exportedAt: string
    mappings: FontMapStore
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

    await chrome.storage.local.set({ [STORAGE_KEY]: next })

    const hostCount = Object.keys(next).length
    const mappingCount = Object.values(next).reduce((sum, m) => sum + Object.keys(m).length, 0)
    return { hostCount, mappingCount }
}

export async function clearAllSettings(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEY)
}

export function onMappingsChanged(callback: (store: FontMapStore) => void): () => void {
    const listener = (
        changes: Record<string, chrome.storage.StorageChange>,
        area: chrome.storage.AreaName,
    ) => {
        if (area !== 'local' || !changes[STORAGE_KEY]) return
        callback(normalizeStore(changes[STORAGE_KEY].newValue))
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
}
