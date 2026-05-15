export interface LocalFont {
    displayName: string
    fontId: string
}

export function listLocalFonts(): Promise<LocalFont[]> {
    return new Promise(resolve => {
        chrome.fontSettings.getFontList(fonts => {
            const seen = new Set<string>()
            const list: LocalFont[] = []
            for (const f of fonts || []) {
                const name = f.displayName || f.fontId
                if (!name || seen.has(name)) continue
                seen.add(name)
                list.push({ displayName: name, fontId: f.fontId })
            }
            list.sort((a, b) => a.displayName.localeCompare(b.displayName))
            resolve(list)
        })
    })
}
