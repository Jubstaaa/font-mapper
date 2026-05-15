export const STORAGE_KEY = 'fontMapperMappings'

export type FontMap = Record<string, string>
export type FontMapStore = Record<string, FontMap>

export async function loadAllMappings(): Promise<FontMapStore> {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    return (result[STORAGE_KEY] as FontMapStore) || {}
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
        callback((changes[STORAGE_KEY].newValue as FontMapStore) || {})
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
}
