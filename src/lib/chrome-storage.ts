export const STORAGE_KEY = 'fontMapperMappings'

export interface FontMapping {
    font: string
    scale?: number
}

export type FontMap = Record<string, FontMapping>
export type FontMapStore = Record<string, FontMap>

function normalizeMappings(raw: unknown): FontMap {
    if (!raw || typeof raw !== 'object') return {}
    const out: FontMap = {}
    for (const [source, value] of Object.entries(raw as Record<string, unknown>)) {
        if (typeof value === 'string' && value) {
            out[source] = { font: value }
        } else if (value && typeof value === 'object' && 'font' in value && typeof (value as FontMapping).font === 'string') {
            const v = value as FontMapping
            out[source] = {
                font: v.font,
                scale: typeof v.scale === 'number' && Number.isFinite(v.scale) ? v.scale : undefined,
            }
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
