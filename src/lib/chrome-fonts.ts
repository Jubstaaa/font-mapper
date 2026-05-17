export interface LocalFont {
    family: string
    fullName: string
    postscriptName: string
    style: string
}

interface FontData {
    family: string
    fullName: string
    postscriptName: string
    style: string
}

declare global {
    interface Window {
        queryLocalFonts?: () => Promise<FontData[]>
    }
}

export function isLocalFontsApiAvailable(): boolean {
    return typeof window.queryLocalFonts === 'function'
}

function variantPriority(style: string): number {
    const s = style.toLowerCase()
    if (s === 'regular') return 0
    if (s === 'book' || s === 'roman' || s === 'plain' || s === 'normal') return 1
    if (s === 'medium') return 2
    if (s === 'light') return 3
    return 9
}

export async function listLocalFonts(): Promise<LocalFont[]> {
    if (!window.queryLocalFonts) {
        throw new Error('LOCAL_FONTS_API_UNAVAILABLE')
    }

    const fonts = await window.queryLocalFonts()

    const byFamily = new Map<string, FontData>()
    for (const f of fonts) {
        const existing = byFamily.get(f.family)
        if (!existing || variantPriority(f.style) < variantPriority(existing.style)) {
            byFamily.set(f.family, f)
        }
    }

    return Array.from(byFamily.values())
        .map(f => ({
            family: f.family,
            fullName: f.fullName,
            postscriptName: f.postscriptName,
            style: f.style,
        }))
        .sort((a, b) => a.family.localeCompare(b.family))
}
