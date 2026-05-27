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

function isItalicStyle(style: string): boolean {
    const s = style.toLowerCase()
    return s.includes('italic') || s.includes('oblique')
}

function isBoldStyle(style: string): boolean {
    const s = style.toLowerCase().replace(/\s+/g, '')
    if (!s.includes('bold')) return false
    if (s.includes('semibold') || s.includes('demibold')) return false
    if (s.includes('extrabold') || s.includes('ultrabold')) return false
    return true
}

function isRegularStyle(style: string): boolean {
    const s = style.trim().toLowerCase()
    if (!s) return true
    return s === 'regular' || s === 'book' || s === 'roman' || s === 'plain' || s === 'normal'
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

export interface LocalFontFamilyVariants {
    regular: LocalFont | null
    bold: LocalFont | null
    italic: LocalFont | null
    boldItalic: LocalFont | null
}

export function getFamilyVariants(family: string, fonts: LocalFont[]): LocalFontFamilyVariants {
    const matches = fonts.filter(f => f.family === family)
    if (!matches.length) {
        return { regular: null, bold: null, italic: null, boldItalic: null }
    }

    let regular: LocalFont | null = null
    let bold: LocalFont | null = null
    let italic: LocalFont | null = null
    let boldItalic: LocalFont | null = null

    for (const f of matches) {
        const bold_ = isBoldStyle(f.style)
        const italic_ = isItalicStyle(f.style)
        if (bold_ && italic_) {
            if (!boldItalic) boldItalic = f
        } else if (bold_) {
            if (!bold) bold = f
        } else if (italic_) {
            if (!italic) italic = f
        } else if (isRegularStyle(f.style)) {
            if (!regular) regular = f
        }
    }

    if (!regular) {
        const sorted = [...matches].sort(
            (a, b) => variantPriority(a.style) - variantPriority(b.style),
        )
        regular = sorted[0] ?? null
    }

    return { regular, bold, italic, boldItalic }
}
