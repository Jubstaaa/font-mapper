import type { FontMapping } from './chrome-storage.types'

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

export interface LocalFontFamilyVariants {
    bold: LocalFont | null
    boldItalic: LocalFont | null
    italic: LocalFont | null
    regular: LocalFont | null
}

export function countFamilies(fonts: Pick<LocalFont, 'family'>[]): number {
    return new Set(fonts.map(f => f.family)).size
}

export function getFamilyVariants(
    family: string,
    fonts: LocalFont[]
): LocalFontFamilyVariants {
    const matches = fonts.filter(f => f.family === family)
    if (!matches.length) {
        return { bold: null, boldItalic: null, italic: null, regular: null }
    }

    let regular: LocalFont | null = null
    let bold: LocalFont | null = null
    let italic: LocalFont | null = null
    let boldItalic: LocalFont | null = null

    for (const f of matches) {
        const bold_ = isBoldStyle(f.style)
        const italic_ = isItalicStyle(f.style)
        if (bold_ && italic_) {
            boldItalic ??= f
        } else if (bold_) {
            bold ??= f
        } else if (italic_) {
            italic ??= f
        } else if (isRegularStyle(f.style)) {
            regular ??= f
        }
    }

    if (!regular) {
        const sorted = [...matches].sort(
            (a, b) => variantPriority(a.style) - variantPriority(b.style)
        )
        regular = sorted[0] ?? null
    }

    return { bold, boldItalic, italic, regular }
}

export function isLocalFontsApiAvailable(): boolean {
    return typeof window.queryLocalFonts === 'function'
}

export function isMappingInstalledLocally(
    mapping: Pick<FontMapping, 'id' | 'name'>,
    fonts: Pick<LocalFont, 'family' | 'fullName' | 'postscriptName'>[]
): boolean {
    return fonts.some(
        f =>
            f.family === mapping.name ||
            (mapping.id ? f.postscriptName === mapping.id : false) ||
            f.fullName === mapping.name
    )
}

export async function listLocalFonts(): Promise<LocalFont[]> {
    if (!window.queryLocalFonts) {
        throw new Error('LOCAL_FONTS_API_UNAVAILABLE')
    }

    const fonts = await window.queryLocalFonts()

    return fonts
        .map(f => ({
            family: f.family,
            fullName: f.fullName,
            postscriptName: f.postscriptName,
            style: f.style,
        }))
        .sort((a, b) => {
            const byFamily = a.family.localeCompare(b.family)
            if (byFamily !== 0) return byFamily
            return variantPriority(a.style) - variantPriority(b.style)
        })
}

function isBoldStyle(style: string): boolean {
    const s = style.toLowerCase().replace(/\s+/g, '')
    if (!s.includes('bold')) return false
    if (s.includes('semibold') || s.includes('demibold')) return false
    if (s.includes('extrabold') || s.includes('ultrabold')) return false
    return true
}

function isItalicStyle(style: string): boolean {
    const s = style.toLowerCase()
    return s.includes('italic') || s.includes('oblique')
}

function isRegularStyle(style: string): boolean {
    const s = style.trim().toLowerCase()
    if (!s) return true
    return (
        s === 'regular' ||
        s === 'book' ||
        s === 'roman' ||
        s === 'plain' ||
        s === 'normal'
    )
}

function variantPriority(style: string): number {
    const s = style.toLowerCase()
    if (s === 'regular') return 0
    if (s === 'book' || s === 'roman' || s === 'plain' || s === 'normal')
        return 1
    if (s === 'medium') return 2
    if (s === 'light') return 3
    return 9
}
