import type { FontMapping } from '@/lib/chrome-storage.types'

import { CSS_WIDE_KEYWORDS } from '@/lib/font-family'

export interface ChainMatch {
    mapping: FontMapping
    sourceKey: string
}

export function matchChain(
    chain: string[],
    lookup: Map<string, FontMapping>
): ChainMatch | null {
    for (const font of chain) {
        const key = font.toLowerCase()
        if (CSS_WIDE_KEYWORDS.has(key)) continue
        const mapping = lookup.get(key)
        if (mapping) return { mapping, sourceKey: key }
    }
    return null
}

export function parseFontFamilyChain(value: string): string[] {
    const parts: string[] = []
    let buf = ''
    let quote: null | string = null
    for (let i = 0; i < value.length; i++) {
        const ch = value[i]
        if (quote) {
            if (ch === '\\' && i + 1 < value.length) {
                buf += value[i + 1] ?? ''
                i++
            } else if (ch === quote) {
                quote = null
            } else {
                buf += ch ?? ''
            }
        } else if (ch === '"' || ch === "'") {
            quote = ch
        } else if (ch === ',') {
            const t = buf.trim()
            if (t) parts.push(t)
            buf = ''
        } else if (ch !== undefined && /\s/.test(ch)) {
            if (!buf.endsWith(' ')) buf += ' '
        } else {
            buf += ch ?? ''
        }
    }
    const tail = buf.trim()
    if (tail) parts.push(tail)
    return parts
}

export function pickPickerName(value: string): null | string {
    const trimmed = value.trim().replace(/^["']|["']$/g, '')
    if (!trimmed) return null
    if (CSS_WIDE_KEYWORDS.has(trimmed.toLowerCase())) return null
    return trimmed
}
