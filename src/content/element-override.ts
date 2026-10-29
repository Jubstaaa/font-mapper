import { getFamilyVariants, isMappingInstalledLocally } from '@/lib/chrome-fonts'
import type { CachedLocalFont, FontMap, FontMapping } from '@/lib/chrome-storage'
import { quoteFamily } from '@/lib/font-family'

import type { InlineSnapshot, OverrideState } from './content.types'
import { matchChain, parseFontFamilyChain } from './font-chain'

const MAPPED_ATTR = 'data-fm-mapped'

const overrides = new WeakMap<HTMLElement, OverrideState>()
let cachedFonts: CachedLocalFont[] = []
let lookup = new Map<string, FontMapping>()

export function setCachedFonts(fonts: CachedLocalFont[]): void {
    cachedFonts = fonts
}

export function getOverrideState(node: Element): OverrideState | undefined {
    return node instanceof HTMLElement ? overrides.get(node) : undefined
}

export function hasMappings(): boolean {
    return lookup.size > 0
}

export function rebuildLookup(mappings: FontMap): void {
    lookup = new Map()
    for (const [k, v] of Object.entries(mappings)) {
        if (v?.name) lookup.set(k.toLowerCase(), v)
    }
}

function snapshotInline(el: HTMLElement, prop: string): InlineSnapshot {
    return {
        value: el.style.getPropertyValue(prop),
        priority: el.style.getPropertyPriority(prop),
    }
}

function restoreInline(el: HTMLElement, prop: string, snap: InlineSnapshot): void {
    if (snap.value) {
        el.style.setProperty(prop, snap.value, snap.priority)
    } else {
        el.style.removeProperty(prop)
    }
}

function resolveLocalName(mapping: FontMapping): string {
    if (cachedFonts.length && (mapping.bold || mapping.italic)) {
        const variants = getFamilyVariants(mapping.name, cachedFonts)
        const target =
            (mapping.bold && mapping.italic && variants.boldItalic)
            || (mapping.bold && variants.bold)
            || (mapping.italic && variants.italic)
            || variants.regular
        if (target) return target.postscriptName
    }
    return mapping.id || mapping.name
}

function targetSignatureFor(mapping: FontMapping): string {
    return [
        resolveLocalName(mapping),
        mapping.scale ?? 1,
        mapping.bold ? 1 : 0,
        mapping.italic ? 1 : 0,
        mapping.lineHeight ?? '_',
        mapping.letterSpacing ?? '_',
        mapping.wordSpacing ?? '_',
        mapping.color ?? '_',
    ].join('|')
}

export function restoreElement(el: HTMLElement): void {
    const state = overrides.get(el)
    if (!state) return
    restoreInline(el, 'font-family', state.inlineFontFamily)
    restoreInline(el, 'font-size', state.inlineFontSize)
    restoreInline(el, 'line-height', state.inlineLineHeight)
    restoreInline(el, 'letter-spacing', state.inlineLetterSpacing)
    restoreInline(el, 'word-spacing', state.inlineWordSpacing)
    restoreInline(el, 'color', state.inlineColor)
    el.removeAttribute(MAPPED_ATTR)
    overrides.delete(el)
}

export function applyToElement(el: HTMLElement): void {
    const existing = overrides.get(el)

    if (existing) {
        const stillMapped = lookup.get(existing.sourceKey)
        if (stillMapped && targetSignatureFor(stillMapped) === existing.targetSignature) {
            return
        }
        restoreElement(el)
    }

    const cs = window.getComputedStyle(el)
    const family = cs.fontFamily
    if (!family) return

    const chain = parseFontFamilyChain(family)
    const match = matchChain(chain, lookup)
    if (!match) return
    if (!isMappingInstalledLocally(match.mapping, cachedFonts)) return

    const parsedSize = parseFloat(cs.fontSize)
    const originalSizePx = Number.isFinite(parsedSize) ? parsedSize : 16

    const snapshots = {
        inlineFontFamily: snapshotInline(el, 'font-family'),
        inlineFontSize: snapshotInline(el, 'font-size'),
        inlineLineHeight: snapshotInline(el, 'line-height'),
        inlineLetterSpacing: snapshotInline(el, 'letter-spacing'),
        inlineWordSpacing: snapshotInline(el, 'word-spacing'),
        inlineColor: snapshotInline(el, 'color'),
    }

    const m = match.mapping
    el.style.setProperty('font-family', quoteFamily(resolveLocalName(m)), 'important')

    if (typeof m.scale === 'number' && Number.isFinite(m.scale) && m.scale > 0 && m.scale !== 1) {
        el.style.setProperty('font-size', `${(originalSizePx * m.scale).toFixed(3)}px`, 'important')
    }
    if (typeof m.lineHeight === 'number' && Number.isFinite(m.lineHeight) && m.lineHeight > 0) {
        el.style.setProperty('line-height', String(m.lineHeight), 'important')
    }
    if (typeof m.letterSpacing === 'number' && Number.isFinite(m.letterSpacing)) {
        el.style.setProperty('letter-spacing', `${m.letterSpacing}em`, 'important')
    }
    if (typeof m.wordSpacing === 'number' && Number.isFinite(m.wordSpacing)) {
        el.style.setProperty('word-spacing', `${m.wordSpacing}em`, 'important')
    }
    if (typeof m.color === 'string' && m.color) {
        el.style.setProperty('color', m.color, 'important')
    }

    el.setAttribute(MAPPED_ATTR, match.sourceKey)
    overrides.set(el, {
        sourceKey: match.sourceKey,
        targetSignature: targetSignatureFor(m),
        ...snapshots,
        originalComputedSizePx: originalSizePx,
        originalChain: chain,
    })
}

export function walkAll(): void {
    if (!document.body) return
    if (lookup.size === 0) {
        clearAllOverrides()
        return
    }
    const nodes = document.body.querySelectorAll<HTMLElement>('*')
    applyToElement(document.body)
    for (const node of nodes) applyToElement(node)
}

export function clearAllOverrides(): void {
    const els = document.querySelectorAll<HTMLElement>(`[${MAPPED_ATTR}]`)
    for (const el of els) restoreElement(el)
}
