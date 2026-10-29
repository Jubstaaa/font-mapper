import type { FontMapping } from '@/lib/chrome-storage'

export const SKIP_KEYWORDS = new Set(['inherit', 'initial', 'unset', 'revert', 'revert-layer'])

export function parseFontFamilyChain(value: string): string[] {
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
        } else if (/\s/.test(ch)) {
            if (!buf.endsWith(' ')) buf += ' '
        } else {
            buf += ch
        }
    }
    const tail = buf.trim()
    if (tail) parts.push(tail)
    return parts
}

export interface ChainMatch {
    sourceKey: string
    mapping: FontMapping
}

export function matchChain(chain: string[], lookup: Map<string, FontMapping>): ChainMatch | null {
    for (const font of chain) {
        const key = font.toLowerCase()
        if (SKIP_KEYWORDS.has(key)) continue
        const mapping = lookup.get(key)
        if (mapping) return { sourceKey: key, mapping }
    }
    return null
}

export function pickPickerName(value: string): string | null {
    const trimmed = value.trim().replace(/^["']|["']$/g, '')
    if (!trimmed) return null
    if (SKIP_KEYWORDS.has(trimmed.toLowerCase())) return null
    return trimmed
}
